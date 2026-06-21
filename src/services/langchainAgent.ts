/**
 * LangChain Agent Service — ZombieCoder
 * 
 * Uses @langchain/langgraph createReactAgent for:
 * - Tool calling (MCP tools as LangChain tools)
 * - Conversation memory (via MemorySaver checkpoint)
 * - Multi-provider routing via proxi-bridge (localhost:9999)
 * - RAG context injection via RAGModule (Self-Healing SSOT)
 * 
 * Reference: https://js.langchain.com/docs/langgraph
 */

import { ChatOpenAI } from '@langchain/openai';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { callMcpTool } from '../mcp/client';
import { RAGModule } from './ragModule';
import { fetchAvailableModels, resolveModel } from '../LangChainAgent/agent.config';

// Dynamic imports for langgraph (subpath exports need node16 moduleResolution)
let createReactAgent: any = null;
let MemorySaverClass: any = null;

async function loadLangGraph() {
  if (!createReactAgent) {
    // Use dynamic require to bypass moduleResolution issues
    const langgraph = require('@langchain/langgraph');
    const prebuilt = require('@langchain/langgraph/prebuilt');
    createReactAgent = prebuilt.createReactAgent;
    MemorySaverClass = langgraph.MemorySaver;
    console.log('✅ LangGraph loaded dynamically');
  }
}

// ── Conversation Memory Store ──────────────────────────────────
const memoryStore = new Map<string, any>();

// ── RAG Module (Self-Healing SSOT) ─────────────────────────────
const ragModule = new RAGModule({ enabled: true, rescanThreshold: 3 });

function getMemory(sessionId: string): any {
  if (!memoryStore.has(sessionId)) {
    memoryStore.set(sessionId, new MemorySaverClass());
  }
  return memoryStore.get(sessionId)!;
}

// ── LangChain Tools (wrapping MCP tools) ──────────────────────

const countModelsTool = tool(
  async () => {
    const result = await callMcpTool('count_models', {});
    return JSON.stringify(result);
  },
  {
    name: 'count_models',
    description: 'Count all AI models in the system database. Returns total count, free vs paid breakdown, and per-provider counts.',
    schema: z.object({}),
  }
);

const countProvidersTool = tool(
  async () => {
    const result = await callMcpTool('count_providers', {});
    return JSON.stringify(result);
  },
  {
    name: 'count_providers',
    description: 'Count all LLM providers configured in the system. Returns list of providers with their status.',
    schema: z.object({}),
  }
);

const listFilesTool = tool(
  async ({ directory }) => {
    const result = await callMcpTool('list_files', { directory: directory || process.cwd() });
    return JSON.stringify(result);
  },
  {
    name: 'list_files',
    description: 'List files and directories in a given path. Use to explore project structure.',
    schema: z.object({
      directory: z.string().describe('Directory path to list'),
    }),
  }
);

const readFileTool = tool(
  async ({ file_path, max_lines }) => {
    const result = await callMcpTool('read_file', { file_path, max_lines: max_lines || 100 });
    return JSON.stringify(result);
  },
  {
    name: 'read_file',
    description: 'Read the contents of a file. Use when user asks about code, config, or file content.',
    schema: z.object({
      file_path: z.string().describe('Absolute path to the file'),
      max_lines: z.number().optional().default(100).describe('Max lines to read'),
    }),
  }
);

const searchCodeTool = tool(
  async ({ pattern, directory }) => {
    const result = await callMcpTool('search_code', { pattern, directory: directory || process.cwd() });
    return JSON.stringify(result);
  },
  {
    name: 'search_code',
    description: 'Search for code patterns (regex) across files in a directory. Use to find functions, classes, variables.',
    schema: z.object({
      pattern: z.string().describe('Regex pattern to search for'),
      directory: z.string().optional().default('.').describe('Directory to search in'),
    }),
  }
);

const runCommandTool = tool(
  async ({ command }) => {
    const result = await callMcpTool('run_command', { command });
    return JSON.stringify(result);
  },
  {
    name: 'run_command',
    description: 'Execute a shell command and return output. Use for git, npm, ls, etc.',
    schema: z.object({
      command: z.string().describe('Shell command to execute'),
    }),
  }
);

const getProjectInfoTool = tool(
  async ({ directory }) => {
    const result = await callMcpTool('get_project_info', { directory: directory || process.cwd() });
    return JSON.stringify(result);
  },
  {
    name: 'get_project_info',
    description: 'Get project info from package.json. Use to understand project name, version, dependencies.',
    schema: z.object({
      directory: z.string().optional().default('.').describe('Project directory'),
    }),
  }
);

const dbQueryTool = tool(
  async ({ query }) => {
    const result = await callMcpTool('db_query', { query });
    return JSON.stringify(result);
  },
  {
    name: 'db_query',
    description: 'Execute a SELECT-only SQL query against the state database. Use for conversations, usage stats, system state.',
    schema: z.object({
      query: z.string().describe('SQL SELECT query'),
    }),
  }
);

// All tools array
const ALL_TOOLS = [
  countModelsTool,
  countProvidersTool,
  listFilesTool,
  readFileTool,
  searchCodeTool,
  runCommandTool,
  getProjectInfoTool,
  dbQueryTool,
];

// ── Agent Runner ──────────────────────────────────────────────

export interface AgentRunParams {
  messages: Array<{ role: string; content: string }>;
  sessionId: string;
  systemPrompt?: string;
  modelName?: string;
  directory?: string; // Working directory for RAG context
}

export interface AgentRunResult {
  response: string;
  model: string;
  toolCalls: string[];
  conversationId: string;
}

/**
 * Run the LangChain agent with conversation memory, tools, and RAG context.
 *
 * Model selection priority:
 *   1. Frontend-provided 'model' field (user override) — validated against server list
 *   2. Default: deepseek-v4-flash-free (fast, available on proxi-bridge)
 * The full model list is fetched from http://localhost:9999/v1/models at startup.
 */
export async function runLangChainAgent(params: AgentRunParams): Promise<AgentRunResult> {
  const { messages, sessionId, systemPrompt, modelName, directory } = params;

  // Load LangGraph dynamically
  await loadLangGraph();

  // Ensure available models are cached (best-effort, non-blocking)
  fetchAvailableModels().catch(() => {});

  // Get or create memory checkpoint for this session
  const memory = getMemory(sessionId);

  // ── RAG Context Injection ──────────────────────────────────────
  // Ensure SSOT exists for the working directory, then inject context.
  // This makes the agent "never work blind" — it always has project context.
  let ragContext = '';
  if (directory) {
    try {
      // Ensure SSOT exists and is current (self-healing)
      const ssotContent = await ragModule.ensureSSOT(directory);
      if (ssotContent) {
        // Detect if the user's message needs RAG context
        const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || '';
        if (ragModule.detectRagIntent(lastUserMsg)) {
          // Get full context: SSOT base + search results
          ragContext = ragModule.getFullContext(lastUserMsg);
        } else {
          // Even without intent detection, provide base SSOT context
          ragContext = ssotContent.substring(0, 2000); // First 2KB of SSOT
        }
      }
    } catch (e: any) {
      console.warn('[LangChainAgent] RAG context injection failed:', e?.message || e);
    }
  }

  // Build enhanced system prompt with RAG context
  const basePrompt = systemPrompt || 'You are ZombieCoder, a local-first AI assistant. You have access to tools to query the system database, read files, search code, and execute commands. Always use tools when the user asks factual questions about the system. Answer in the same language the user uses.';
  const enhancedPrompt = ragContext
    ? `${basePrompt}\n\n--- Project Context ---\n${ragContext}\n--- End Project Context ---`
    : basePrompt;

  // Resolve model: user-selected (from frontend) → default (deepseek-v4-flash-free)
  // Models are validated against the server's /v1/models list
  const resolvedModel = resolveModel(modelName, 'deepseek-v4-flash-free');

  // Create LLM pointing to our proxi-bridge
  const llm = new ChatOpenAI({
    modelName: resolvedModel,
    temperature: 0.7,
    maxTokens: 4096,
    configuration: {
      baseURL: 'http://localhost:9999/v1',
    },
    apiKey: 'sk-local', // dummy key, proxi-bridge doesn't validate
  });

  // Build the agent with tools
  const agent = createReactAgent({
    llm,
    tools: ALL_TOOLS,
    checkpointSaver: memory,
    prompt: enhancedPrompt,
  });

  // Convert messages to LangChain format
  const inputMessages = messages.map(m => ({
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content,
  }));

  // Track tool calls
  const toolCalls: string[] = [];

  // Run the agent
  const result = await agent.invoke(
    { messages: inputMessages },
    { configurable: { thread_id: sessionId } }
  );

  // Extract the last AI message
  const lastMessage = result.messages[result.messages.length - 1];
  const response = typeof lastMessage.content === 'string'
    ? lastMessage.content
    : JSON.stringify(lastMessage.content);

  // Extract tool calls from all messages
  for (const msg of result.messages) {
    const aiMsg = msg as any;
    if (aiMsg.tool_calls?.length > 0) {
      for (const tc of aiMsg.tool_calls) {
        toolCalls.push(tc.name);
      }
    }
  }

  return {
    response,
    model: resolvedModel,
    toolCalls,
    conversationId: sessionId,
  };
}

/**
 * Clear conversation memory for a session.
 */
export function clearSessionMemory(sessionId: string): boolean {
  return memoryStore.delete(sessionId);
}

/**
 * Get memory stats.
 */
export function getMemoryStats(): { sessions: number; sessionIds: string[]; ragEnabled: boolean } {
  return {
    sessions: memoryStore.size,
    sessionIds: Array.from(memoryStore.keys()),
    ragEnabled: true,
  };
}

/**
 * Get RAG module instance for external access.
 */
export function getRagModule(): RAGModule {
  return ragModule;
}
