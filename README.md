# 🌿 ZenRoute — Serene AI Gateway & Intelligent Routing Engine

[![GitHub stars](https://img.shields.io/github/stars/joyccn/ZenRoute?style=social)](https://github.com/joyccn/ZenRoute)
[![License](https://img.shields.io/github/license/joyccn/ZenRoute)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-%3E%3D18-green)](https://nodejs.org)
[![Bun](https://img.shields.io/badge/Bun-%3E%3D1.1-black)](https://bun.sh)

> **⚠️ INDEPENDENT PROJECT NOTICE & CREDITS**
> 
> ZenRoute is an independent, enhanced AI routing gateway maintained by **0xJoy**.
> All credit for the original foundations belongs to **decolua** ([github.com/decolua](https://github.com/decolua)). This repository actively maintains, expands, and evolves the codebase under the **ZenRoute** project banner.

---

## ⚡ Overview & Architectural Enhancements

**ZenRoute** is a serene, high-performance, multi-provider AI gateway designed to unify upstream LLM providers (Claude, OpenAI, Gemini, DeepSeek, MiniMax, Kiro, Antigravity) into a single OpenAI-compatible `/v1/*` endpoint with real-time SSE streaming, cross-platform client spoofing, and adaptive payload compression.

> *"Cultivate, prune, and route all your AI models from a single unified gateway."*

---

## 🛠️ Core Engineering Highlights

### 1. ✂️ Ported RTK (Request Token-Killer) Pipe Engine
* Native JavaScript state-machine filters ported directly from Rust (`rtk-ai/rtk`).
* Aggregated test outcomes and failure-capping for `cargo test`, `pytest`, `go test -json`, `mypy`, and `vitest`.
* Reduces repetitive CLI and test output tokens by **20% to 60%** without losing stack-trace context.

### 2. 🎭 Unified Client Version & Fingerprint Spoofing
* Centralized single-source client registry (`open-sse/config/clientVersions.js`).
* Native headers, editor fingerprints, and protocol flags for modern clients: Claude Code, Codex CLI, Cursor AgentService, Antigravity IDE, Kiro, and Grok CLI.

### 3. 🔒 Hardened Security & Password Onboarding
* Default gateway protection with first-time onboarding prompt to secure credentials.
* Dual-auth gating for database import/export operations.
* Explicit non-deterministic secret enforcement and loopback peer trust verification (`x-zen-peer-token`).
* Strict SSRF prevention via asynchronous DNS-pinning and private CIDR blocklist guards.

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
git clone https://github.com/joyccn/ZenRoute.git zenroute
cd zenroute

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
* **Serene Dashboard:** `http://localhost:20128/dashboard`
* **Unified OpenAI Endpoint:** `http://localhost:20128/v1`

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
