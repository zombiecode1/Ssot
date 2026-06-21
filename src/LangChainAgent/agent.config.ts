import path from "path";

// ─── Proxi Bridge URL ───────────────────────────────────────────
const BRIDGE_BASE = process.env.PROXI_BRIDGE_URL || "http://localhost:9999/v1";

// ─── Dynamic Model Registry ─────────────────────────────────────
// Fetches the actual model list from the proxi-bridge server so the
// config always uses models that really exist at runtime.
let _availableModels: string[] | null = null;
let _lastFetch = 0;
const FETCH_TTL = 60_000; // re-fetch every 60 seconds

export async function fetchAvailableModels(): Promise<string[]> {
  const now = Date.now();
  if (_availableModels && now - _lastFetch < FETCH_TTL) {
    return _availableModels;
  }
  try {
    const res = await fetch(`${BRIDGE_BASE}/models`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const json: any = await res.json();
      const models: string[] = (json.data || []).map((m: any) => m.id).filter(Boolean);
      if (models.length > 0) {
        _availableModels = models;
        _lastFetch = now;
        console.log(`[AgentConfig] Fetched ${models.length} models from server`);
        return models;
      }
    }
  } catch {
    // server not reachable — use cached or defaults
  }
  return _availableModels || [];
}

/**
 * Returns the cached model list without fetching (sync, may be empty).
 */
export function getCachedModels(): string[] {
  return _availableModels || [];
}

/**
 * Check if a model name exists in the available server models.
 * If models haven't been fetched yet, returns true conservatively.
 */
export function isModelAvailable(model: string): boolean {
  if (!_availableModels) return true; // not yet fetched — assume available
  if (!model) return false;
  const lower = model.toLowerCase();
  return _availableModels.some((m) => m.toLowerCase() === lower);
}

/**
 * Resolve the best model to use:
 * 1. If userModel is provided AND exists on the server → use it
 * 2. If userModel is provided but NOT on server → fall back to defaultModel
 * 3. If no userModel → use defaultModel
 */
export function resolveModel(userModel?: string, defaultModel?: string): string {
  if (userModel && isModelAvailable(userModel)) {
    return userModel;
  }
  if (userModel && _availableModels && !isModelAvailable(userModel)) {
    console.warn(`[AgentConfig] Requested model "${userModel}" not in server list — falling back to "${defaultModel || "unknown"}"`);
  }
  return defaultModel || "deepseek-v4-flash-free";
}

export const ZombieCoderConfig = {
  project: {
    name: "ZombieCoder Agentic Module",
    version: "1.1.0",
    execution_mode: "embedded_root",
    root_path: process.env.AGENT_ROOT_PATH || "./",
    memory_db_path: path.join(__dirname, "agent_memory.db"),
  },
  inference: {
    primary_provider: "opencode",
    fallback_provider: "universal_openai",
    opencode: {
      api_base: BRIDGE_BASE,
      default_model: "deepseek-v4-flash-free",
      // 📌 Model names are validated at runtime via fetchAvailableModels()
      // and can be overridden by the user via the 'model' field in requests.
      models: {
        code_agent: "north-mini-code-free",
        analysis_agent: "big-pickle",
        general_agent: "mimo-v2.5-free",
        architect_agent: "nemotron-3-ultra-free",
        engineer_agent: "north-mini-code-free",
        qa_agent: "big-pickle",
        docs_agent: "mimo-v2.5-free",
        ops_agent: "nemotron-3-ultra-free",
      },
      fallback_models: {
        code_agent: "deepseek-v4-flash-free",
        analysis_agent: "nemotron-3-ultra-free",
        general_agent: "deepseek-v4-flash-free",
        architect_agent: "big-pickle",
        engineer_agent: "deepseek-v4-flash-free",
        qa_agent: "nemotron-3-ultra-free",
        docs_agent: "deepseek-v4-flash-free",
        ops_agent: "big-pickle",
      },
    },
    universal_openai: {
      api_base: process.env.UNIVERSAL_LLM_BASE || "http://localhost:11434/v1",
      api_key: process.env.UNIVERSAL_LLM_KEY || "local-bypass",
      default_model: process.env.UNIVERSAL_LLM_MODEL || "qwen2.5-coder:7b",
    },
  },
  response_mode: {
    type: "stream",
    capture_runtime_events: true,
    trust_checker_enabled: true,
  },
};
