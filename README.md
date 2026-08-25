# 🐋 AI Gateway & Routing Engine (Experimental Research Fork)

> **⚠️ DISCLAIMER & INDEPENDENT PROJECT NOTICE**
> 
> This repository is a **custom research, optimization, and engineering playground** maintained by **0xJoy**.
> 
> * **Independent Evolution:** This codebase contains heavy architectural refactors, experimental optimizations, low-level Rust-to-JS RTK ported engines, single-source client fingerprinting, memory-leak hardening, and Cloudflare edge proxy integration.
> * **No Affiliation:** This project is an independent fork and is **NOT affiliated with, endorsed by, or associated with the original 9Router upstream project, maintainers, or official website**.
> * **Support & Issues:** Do **NOT** report issues, bugs, or questions arising from this repository to the original upstream 9Router project or community. All experimental changes and architectural divergence live exclusively in this repository.

---

## ⚡ Overview & Architectural Enhancements

An ultra-resilient, multi-provider AI gateway designed to unify upstream LLM providers (Claude, OpenAI, Gemini, DeepSeek, MiniMax, Kiro, Antigravity) into unified OpenAI-compatible endpoints with real-time SSE streaming, cross-platform client spoofing, and adaptive payload compression.

---

## 🛠️ Core Engineering Highlights in this Fork

### 1. ✂️ Ported RTK (Request Token-Killer) Pipe Engine
* Re-implemented and ported from `rtk-ai/rtk` (Rust) directly into native JavaScript state-machine filters.
* Aggregated test outcomes and failure-capping for `cargo test`, `pytest`, `go test -json`, `mypy`, and `vitest`.
* Reduces repetitive CLI and test output tokens by **20% to 60%** without losing stack-trace context.

### 2. 🎭 Unified Client Version & Fingerprint Spoofing
* Centralized single-source client registry (`open-sse/config/clientVersions.js`).
* Native headers, editor fingerprints, and protocol flags for modern clients (Claude Code, Codex CLI, Cursor AgentService, Antigravity IDE, Kiro, and Grok CLI).

### 3. 🔒 Hardened Peer Trust & Enterprise Security
* Dual-auth gating for database import/export operations.
* Explicit non-deterministic secret enforcement and loopback peer trust verification (`x-9r-peer-token`).
* Strict SSRF prevention via DNS-pinning and private CIDR blocklist guards.

### 4. 🌊 High-Throughput Streaming & Zero-Leak Lifecycle
* Fully decoupled SSE/NDJSON streaming parser with duplicate token-delta prevention.
* Atomic database fsync synchronization and automatic cleanup of dangling SSE listeners on client disconnection.

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
* **Node.js** `>= 18.0.0` or **Bun** `>= 1.1.0`
* **npm**, **pnpm**, or **bun**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/joyccn/9router.git
cd 9router

# 2. Copy environment configuration
cp .env.example .env

# 3. Install dependencies
npm install
# or with Bun:
bun install

# 4. Start Development Server
npm run dev
# or with Bun:
bun run dev:bun
```

The gateway dashboard and `/v1/*` proxy will be accessible at:
* **Dashboard:** `http://localhost:20128/dashboard`
* **OpenAI Endpoint:** `http://localhost:20128/v1`

---

## 🧪 Running the Test Suite

```bash
# Run unit & integration tests
cd tests && npm install
npx vitest run
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE) with all respective upstream copyrights acknowledged for the original base foundations.
