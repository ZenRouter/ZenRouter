<div align="center">

# ZenRouter

**Serene AI Gateway & Intelligent Routing Engine**

*Connect every AI coding tool to 40+ providers with automatic fallback, multi-account rotation, and 20–60% token compression.*

<br/>

[![npm version](https://img.shields.io/npm/v/zenrouter.svg?color=4B72A4&label=npm)](https://www.npmjs.com/package/zenrouter)
[![npm downloads](https://img.shields.io/npm/dm/zenrouter.svg?color=4B72A4&label=downloads)](https://www.npmjs.com/package/zenrouter)
[![GitHub stars](https://img.shields.io/github/stars/ZenRouter/ZenRouter?style=social)](https://github.com/ZenRouter/ZenRouter)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-%3E%3D18-green)](https://nodejs.org)
[![Bun](https://img.shields.io/badge/Bun-%3E%3D1.1-black)](https://bun.sh)

<br/>

<table>
  <tr>
    <td align="right"><b>Start</b></td>
    <td align="center"><a href="#quick-start">Quick Start</a></td>
    <td align="center"><a href="#installation-methods">Installation</a></td>
    <td align="center"><a href="#zero-config-usage">Zero Config</a></td>
  </tr>
  <tr>
    <td align="right"><b>Learn</b></td>
    <td align="center"><a href="#why-zenrouter">Why ZenRouter</a></td>
    <td align="center"><a href="#architecture--engineering-highlights">Architecture</a></td>
    <td align="center"><a href="#3-layer-resilience">Resilience</a></td>
  </tr>
  <tr>
    <td align="right"><b>Features</b></td>
    <td align="center"><a href="#smart-combos--routing-strategies">Smart Combos</a></td>
    <td align="center"><a href="#token-compression-rtk--caveman">Token Savers</a></td>
    <td align="center"><a href="#supported-providers--models">Providers</a></td>
  </tr>
  <tr>
    <td align="right"><b>Integrations</b></td>
    <td align="center"><a href="#cli-tools--coding-agents">CLI Tools</a></td>
    <td align="center"><a href="#agent-skills">Agent Skills</a></td>
    <td align="center"><a href="#testing--verification">Test Suite</a></td>
  </tr>
</table>

</div>

## Quick Start

### ⚡ One-Line Automated Install (Recommended)

Install ZenRouter instantly via the official install script:

```bash
curl -fsSL https://raw.githubusercontent.com/ZenRouter/ZenRouter/master/install.sh | bash
```

---

### 📦 Alternative 1: Global Installation (npm)

```bash
# Install globally
npm install -g zenrouter

# Start the gateway
zenrouter
```

The gateway dashboard will open automatically at **`http://localhost:20128/dashboard`** with the API available at **`http://localhost:20128/v1`**.

---

### 🐳 Alternative 2: Docker Deployment

```bash
docker run -d \
  --name zenrouter \
  -p 20128:20128 \
  -v "$HOME/.zenrouter:/app/data" \
  -e DATA_DIR=/app/data \
  --restart unless-stopped \
  zenrouter/zenrouter:latest
```

Or with `docker-compose.yml`:

```yaml
services:
  zenrouter:
    image: zenrouter/zenrouter:latest
    container_name: zenrouter
    restart: unless-stopped
    ports:
      - "20128:20128"
    volumes:
      - zenrouter-data:/app/data
    environment:
      DATA_DIR: /app/data
      PORT: "20128"

volumes:
  zenrouter-data:
```

---

### 3. Local Development from Source

```bash
# 1. Clone the repository
git clone https://github.com/ZenRouter/ZenRouter.git zenrouter
cd zenrouter

# 2. Setup configuration
cp .env.example .env

# 3. Install dependencies
npm install
# or with Bun:
bun install

# 4. Start the server
npm run dev
# or with Bun:
bun run dev:bun
```

---

## Zero-Config Usage

ZenRouter works out-of-the-box. Free providers (such as OpenCode Free and Kiro) can be used immediately without requiring external API keys:

```bash
# Test direct completion via OpenAI-compatible endpoint
curl http://localhost:20128/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "auto",
    "messages": [
      { "role": "user", "content": "Explain binary search in one concise sentence." }
    ]
  }'
```

---

## Architecture & Engineering Highlights

```
┌─────────────────────────────────────────────────────────────┐
│             Your AI Coding Tools & IDEs                     │
│   (Claude Code, Cursor, Codex, Antigravity, Cline, Aider)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ OpenAI/Anthropic Wire Format
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    ZenRouter Smart Gateway                  │
│                                                             │
│  ├─ Hardened Loopback Auth (x-zen-peer-token verification)  │
│  ├─ Ported RTK Engine (20-60% context compression)          │
│  ├─ Smart Combos (Priority, Round-Robin, Headroom, Least)   │
│  ├─ 3-Layer Resilience (Circuit Breaker, Cooldown, Lockout) │
│  └─ Client Fingerprint Spoofing & TLS Stealth               │
└──────────────┬────────────────┬───────────────┬─────────────┘
               │                │               │
               ▼                ▼               ▼
      [Tier 1: Subscriptions]  [Tier 2: APIs]  [Tier 3: Free]
      Claude Pro/Max, Codex,    OpenAI, Gemini,  Kiro, OpenCode,
      Kiro AWS, Antigravity     DeepSeek, GLM    Groq Free Tiers
```

### 1. Ported RTK (Request Token-Killer) Engine
- Ported state-machine filters from Rust (`rtk-ai/rtk`).
- Compresses repetitive CLI outputs (`git diff`, `git status`, `cargo test`, `pytest`, `go test -json`, `vitest`) before forwarding to the LLM.
- Preserves crucial failure stack traces while reducing input tokens by **20% to 60%**.

### 2. Unified Client Fingerprint & Protocol Spoofing
- Single-source client header registry (`open-sse/config/clientVersions.js`).
- Emulates official protocol headers and client fingerprints for Claude Code, Codex CLI, Cursor AgentService, Antigravity IDE, and Grok CLI.

### 3. Hardened Security & Loopback Peer Trust
- Custom HTTP server generates an ephemeral 48-character hex peer token (`x-zen-peer-token`) at boot.
- Derives client IP directly from the TCP socket to prevent `X-Forwarded-For` spoofing on loopback endpoints.
- Built-in SSRF protection with asynchronous DNS-pinning and private CIDR blocklist filters.
- Local SQLite database stored securely at `~/.zenrouter/db/data.sqlite`.

### 4. Zero-Leak SSE Streaming Engine
- Decoupled SSE/NDJSON streaming parser with duplicate token-delta prevention.
- Automatic cleanup of dangling upstream connections on client disconnects.

---

## 3-Layer Resilience

ZenRouter employs three distinct self-healing layers to ensure continuous availability:

```
[Request Failed]
       │
       ├─► 5xx / Gateway Timeout ──► Layer 1: Provider Circuit Breaker
       │                             (Trips provider, switches to next target in combo)
       │
       ├─► 429 Rate Limit        ──► Layer 2: Key / Account Cooldown
       │                             (Exponential backoff honoring Retry-After per key)
       │
       └─► Model 404 / Mode Deny ──► Layer 3: Model-Level Lockout
                                     (Locks specific model ID, keeps account active)
```

1. **Layer 1: Provider Circuit Breaker** — Automatically trips when a provider encounters repeated upstream 5xx errors or network timeouts, immediately failing over to the next candidate in the active combo.
2. **Layer 2: Key & Account Cooldown** — When an account hits a 429 rate limit, ZenRouter places only that specific key into cooldown (honoring `Retry-After`) and routes subsequent traffic to sibling keys in the pool.
3. **Layer 3: Model-Level Lockout** — Isolates failures to specific model IDs without disabling entire provider credentials.

---

## Smart Combos & Routing Strategies

A **Combo** is a prioritized group of models that ZenRouter routes across automatically. If a provider reaches quota or errors, ZenRouter seamlessly advances to the next healthy model.

| Strategy | Description | Best For |
| :--- | :--- | :--- |
| `priority` | Strict sequential order; drains each target before moving to the next. | Primary subscription with free backup |
| `round-robin` | Distributes requests evenly across all targets in the list. | Multi-account load distribution |
| `least-used` | Selects the target with the lowest recent request count. | Balancing API usage across team keys |
| `headroom` | Routes to the target with the most remaining quota. | Multi-subscription balance |
| `cost-optimized` | Selects the lowest-cost model for the requested tier. | Budget optimization |
| `cache-optimized` | Pins identical prompt prefixes to the same connection. | Maximizing prompt-cache hit rates |

---

## CLI Tools & Coding Agents

ZenRouter seamlessly connects to any tool that supports OpenAI-compatible or Anthropic-compatible APIs:

### Claude Code

```bash
export ANTHROPIC_BASE_URL="http://localhost:20128"
export ANTHROPIC_API_KEY="sk-zenrouter" # or your dashboard key
claude
```

### Cursor / Cline / Roo Code / OpenCode

Configure the API settings in your editor:
- **Base URL / Endpoint:** `http://localhost:20128/v1`
- **API Key:** `sk-zenrouter` (or copy from Dashboard → Keys)
- **Model:** `auto` (or provider-specific model IDs like `claude-3-7-sonnet`, `gpt-4o`, `deepseek-chat`)

### Codex CLI

```bash
export OPENAI_BASE_URL="http://localhost:20128/v1"
export OPENAI_API_KEY="sk-zenrouter"
codex
```

### Aider

```bash
aider --openai-api-base http://localhost:20128/v1 --openai-api-key sk-zenrouter --model openai/gpt-4o
```

---

## Supported Providers & Models

ZenRouter connects to over 40 AI providers and hundreds of models across multiple categories:

- **Frontier Models:** Anthropic Claude (Opus / Sonnet / Haiku), OpenAI (GPT-4o, o1, o3-mini, GPT-5), Google Gemini (2.5 Pro / Flash).
- **Open Weights & Fast Inference:** DeepSeek (V3, R1), Groq, Together AI, Mistral AI, Cerebras, Sambanova, Fireworks.
- **Specialized & Coding Providers:** Kiro (AWS SSO), OpenCode Free, Antigravity, MiniMax, Qwen, GLM / Zhipu, Moonshot / Kimi, xAI Grok.
- **Multimodal & Tools:** Text-to-Image (DALL-E, FLUX, Imagen), Text-to-Speech (ElevenLabs, Deepgram, Edge TTS), Speech-to-Text (Whisper, Groq STT), Web Search (Tavily, Exa, Brave, SearXNG), and Web Fetch (Firecrawl, Jina).

---

## Agent Skills

ZenRouter provides standard AI Agent Skills ready to index and consume directly from your agentic workflows:

```bash
export ZENROUTER_URL="http://localhost:20128"
export ZENROUTER_KEY="sk-zenrouter"
```

| Skill | Endpoint | Description |
| :--- | :--- | :--- |
| `zenrouter` | `/` | Entry skill with setup guide and capability catalog index. |
| `zenrouter-chat` | `/v1/chat/completions` | Chat and code generation with streaming SSE. |
| `zenrouter-image` | `/v1/images/generations` | Image generation across DALL-E, FLUX, Imagen, etc. |
| `zenrouter-tts` | `/v1/audio/speech` | Text-to-speech with multi-provider voice options. |
| `zenrouter-stt` | `/v1/audio/transcriptions` | Audio transcription via Whisper and Groq STT. |
| `zenrouter-embeddings` | `/v1/embeddings` | Vector generation for semantic search and RAG. |
| `zenrouter-web-search` | `/v1/search` | Web search aggregation (Tavily, Exa, Brave, SearXNG). |
| `zenrouter-web-fetch` | `/v1/web/fetch` | Web content scraping to markdown and clean HTML. |

Skill specifications are located in [`skills/`](skills/).

---

## Testing & Verification

ZenRouter includes a test suite covering unit, integration, and security scenarios:

```bash
# Run the complete test suite
npm test

# Run a specific test file
npx vitest run tests/unit/custom-server-peer-headers.test.js
```

---

## Configuration Reference

Key environment variables configurable via `.env`:

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `20128` | HTTP gateway port. |
| `DATA_DIR` | `~/.zenrouter` | Database and persistent configuration directory. |
| `JWT_SECRET` | *(auto-generated)* | Signing secret for web dashboard session cookies. |
| `INITIAL_PASSWORD` | *(prompted on first boot)* | Initial dashboard admin password. |
| `REQUIRE_API_KEY` | `false` | When true, requires API keys for all remote `/v1` requests. |
| `HTTP_PROXY` / `ALL_PROXY` | `""` | Optional outbound proxy for upstream API requests. |
| `ZENROUTER_MAX_OLD_SPACE_SIZE` | `6144` | V8 memory heap size limit in megabytes. |

---

## License

This project is licensed under the [MIT License](LICENSE).
