# 🧟 ZombieCoder — Where Code Speaks

> *"যেখানে কোড ও কথা বলে"* — Where code and words come alive

[![License](https://img.shields.io/badge/license-proprietary-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue.svg)](https://typescriptlang.org)

---

## 📖 What is ZombieCoder?

**ZombieCoder** is not just another AI tool — it's a **movement**.

In a world where talented dreams are crushed by lack of opportunity, where skilled individuals become "zombies" — not dead, but mentally defeated by society's indifference — ZombieCoder rises as a beacon of hope.

### The Story Behind the Name

The word "Zombie" here doesn't refer to the undead. It represents **millions of people** who:

- 💔 Have dreams but no resources
- 🎯 Have skills but no recognition  
- 😔 Are slowly becoming "zombies" — mentally defeated
- 🌟 Still believe: *"I can try, even if I fail"*

**ZombieCoder** is for those who refuse to give up. It's a tool that:
- Acknowledges your mistakes (unlike other AI that hides errors)
- Learns from failures (each attempt teaches something new)
- Never judges (unlike society that measures success by money)
- Always tries again (because that's what real courage looks like)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    ZombieCoder Agent System                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Memory     │  │    RAG      │  │   Tools     │             │
│  │  (SQLite)   │  │  (SSOT.md)  │  │ (9 tools)   │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                       │
│         └────────────────┼────────────────┘                       │
│                          │                                        │
│                    ┌─────▼─────┐                                 │
│                    │  Tool     │                                 │
│                    │ Registry  │                                 │
│                    └─────┬─────┘                                 │
│                          │                                        │
│              ┌───────────┼───────────┐                           │
│              │           │           │                            │
│         ┌────▼────┐ ┌────▼────┐ ┌────▼────┐                     │
│         │  File   │ │ Search  │ │  Shell  │                     │
│         │  Tools  │ │ (DDG)   │ │  Tools  │                     │
│         └─────────┘ └─────────┘ └─────────┘                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🤖 Our Agents

### 1. 🏛️ Solution Architect Agent
**Role**: System design, scalability, technical decisions

| Feature | Details |
|---------|---------|
| **Primary Model** | nemotron-3-ultra-free |
| **Fallback** | big-pickle |
| **Capabilities** | ADR creation, database design, architecture review |

### 2. 💻 Development Engineer Agent  
**Role**: Code implementation, debugging, optimization

| Feature | Details |
|---------|---------|
| **Primary Model** | north-mini-code-free |
| **Fallback** | deepseek-v4-flash-free |
| **Capabilities** | Code generation, refactoring, bug fixing |

### 3. ✅ Quality Assurance Agent
**Role**: Testing, validation, quality checks

| Feature | Details |
|---------|---------|
| **Primary Model** | big-pickle |
| **Fallback** | nemotron-3-ultra-free |
| **Capabilities** | Test generation, code review, regression testing |

### 4. 📚 Documentation Agent
**Role**: Technical writing, documentation, guides

| Feature | Details |
|---------|---------|
| **Primary Model** | mimo-v2.5-free |
| **Fallback** | deepseek-v4-flash-free |
| **Capabilities** | README generation, API docs, tutorials |

### 5. ⚙️ Operations Agent
**Role**: Deployment, monitoring, DevOps

| Feature | Details |
|---------|---------|
| **Primary Model** | nemotron-3-ultra-free |
| **Fallback** | big-pickle |
| **Capabilities** | CI/CD, Docker, infrastructure setup |

---

## 🛠️ Available Tools

### File System Tools (Cross-Platform)
| Tool | Description | Platform |
|------|-------------|----------|
| `read_file` | Read file content | Win/Linux/Mac |
| `list_files` | List directory contents | Win/Linux/Mac |
| `find_files` | Find files by name | Win/Linux/Mac |
| `search_code` | Search code content | Win/Linux/Mac |
| `write_file` | Write to file | Win/Linux/Mac |
| `get_file_info` | Get file metadata | Win/Linux/Mac |

### Search Tools
| Tool | Description | API Key Required |
|------|-------------|------------------|
| `web_search` | DuckDuckGo search | ❌ No |

### Shell Tools
| Tool | Description | Auto-Detect |
|------|-------------|-------------|
| `run_command` | Execute commands | ✅ PowerShell/bash |
| `get_platform_info` | System information | ✅ OS detection |

---

## 📊 SSOT (Single Source of Truth)

SSOT.md is auto-generated documentation that:
- Scans your project structure
- Documents key files and configurations
- Updates automatically when files change
- Serves as context for all agents

### SSOT Flag System
| Flag | State | Description |
|------|-------|-------------|
| 0 | Not Scanned | Directory never indexed |
| 1 | Scanning | Currently being processed |
| 2 | Indexed | SSOT up-to-date |
| 3 | Error | Scan failed |

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/zombiecode1/Ssot.git
cd Ssot

# Install dependencies
npm install

# Build
npm run build

# Start the server
npm start
```

### Environment Setup
```bash
# Copy example env
cp .env.example .env

# Edit .env with your settings
# Required: GROQ_API_KEY (for LLM access)
```

---

## 🌐 API Endpoints

### Health & Status
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| GET | `/v1/models` | List available models |

### Agent Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/agent/chat` | Chat with agent |
| GET | `/v1/agent/status` | Agent system status |
| GET | `/v1/agent/clients` | Connected clients |
| POST | `/v1/agent/register` | Register editor |
| GET | `/v1/agent/index` | Directory index |

### MCP Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/mcp` | JSON-RPC requests |
| GET | `/mcp` | SSE stream |
| GET | `/mcp/info` | MCP server info |

---

## 🔧 Configuration

### Agent Models
```javascript
// agent.config.ts
export const ZombieCoderConfig = {
  inference: {
    opencode: {
      models: {
        architect_agent: "nemotron-3-ultra-free",
        engineer_agent: "north-mini-code-free",
        qa_agent: "big-pickle",
        docs_agent: "mimo-v2.5-free",
        ops_agent: "nemotron-3-ultra-free",
      }
    }
  }
};
```

---

## 📚 Documentation

- [Architecture Guide](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Tool Registry](docs/TOOLS.md)

---

## 🤝 Contributing

ZombieCoder is built by dreamers, for dreamers.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 📄 License

Proprietary — Local Freedom Protocol

---

## 💬 Tagline

> **"যেখানে কোড ও কথা বলে"**  
> *Where code and words come alive*

---

## 🙏 Acknowledgments

Built with ❤️ by [Sahon Srabon](https://zombiecoder.my.id)  
Organization: [Smart Learning Platform BD](https://smartearningplatformbd.net)

*"Every failed attempt is a step closer to success."*
