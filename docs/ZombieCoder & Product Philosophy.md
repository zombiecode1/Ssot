# **ZombieCoder Agentic Hub**

**"Where code speaks, and problems are shoulder-driven."**

## **🎯 What is ZombieCoder & Product Philosophy?**

In the current tech ecosystem, thousands of brilliant developers and dreamers are pushed into isolation due to economic constraints, constant failures, and lack of opportunities. They become the "Zombies" of this modern era—alive, yet their dreams are systematically crushed by the unreliability and corporate gatekeeping of modern tools.

**ZombieCoder** is an open-source, local-first agentic hub built for those who refuse to give up. It is designed to bridge the gap between speculative AI hype and deterministic software engineering by introducing a **Self-Healing, Zero-Trust Architecture**.

### **The Local-First Reality Check**

We don't sell the corporate illusion of absolute privacy. In a world governed by Intel motherboards, Nvidia GPUs, Windows OS, and Chromium V8 engines, pure isolation is a myth. By **Local-First**, we mean that the core execution logic, context retrieval, and decision-making framework remain fully under your local jurisdiction, minimizing external dependency and stealth tracking.

## **🏛️ The 5 Specialist Agents**

| Agent | Role | Default Model | Real-world Context |
| :---- | :---- | :---- | :---- |
| 🏛️ **Solution Architect** | System design & scalability | nemotron-3-ultra-free | The battlefield strategist mapping out architectural blueprints. |
| 💻 **Development Engineer** | Implementation & debugging | north-mini-code-free | The core mechanic writing production-ready code. |
| ✅ **Quality Assurance** | Validation & test plans | big-pickle | The silent guardian validating state transitions and edge cases. |
| 📚 **Documentation** | API guides & technical logs | mimo-v2.5-free | The chronicler keeping tabs on system state and usage manuals. |
| ⚙️ **Operations** | Deployment & monitoring | nemotron-3-ultra-free | The pilot responsible for keeping the local server up and running. |

## **📊 SSOT (Single Source of Truth) & Self-Healing Loop**

The fundamental flaw of modern AI agents is the lack of strict context anchoring, leading to hallucinations. ZombieCoder solves this using a localized **SSOT.md** file that serves as an immutable project registry.

Even if external OS-level file watchdogs crash, the agent uses a **Self-Healing Flag Protocol** on every incoming client request:

* **Flag 0 (Not Indexed):** Trigger auto-reindexing to systematically generate the codebase context mapping.  
* **Flag 1 (Indexed & Safe):** Anchor all prompt completions strictly against the verified local SSOT manifest.

## **🛠️ Available Core Tools**

### **📁 File System Network (Cross-Platform)**

* read\_file, write\_file, list\_files, find\_files, search\_code, get\_file\_info.

### **🔍 Utility Controllers**

* web\_search (DuckDuckGo integration without API leaks).  
* run\_command (Automated PowerShell/Bash pipeline detection).

## **🌐 Editor Integration Endpoints**

Integrate your IDE seamlessly using the following internal bridges:

* **REST Gateway (JetBrains/VS Code):** POST http://localhost:9999/v1/agent/chat  
* **MCP Protocol (Cursor/Windsurf):** http://localhost:9999/mcp  
* **Streaming Conduit:** http://localhost:9999/sse

## **🚀 Quick Start**

Bash  
git clone https://github.com/zombiecode1/Ssot.git  
cd Ssot  
npm install  
npm run build  
npm start

Launch http://localhost:9999 and begin developing with absolute sovereignty.

*Developed by Sahon Srabon | Developer Zone | Dhaka, Bangladesh*

