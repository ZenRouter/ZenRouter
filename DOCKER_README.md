# 🌿 ZenRoute

> **Serene AI Gateway & Intelligent Multi-Provider Routing Engine**

[![Docker Pulls](https://img.shields.io/docker/pulls/joyccn/zenroute.svg?style=flat-square&color=4B72A4)](https://hub.docker.com/r/joyccn/zenroute)
[![Docker Image Size](https://img.shields.io/docker/image-size/joyccn/zenroute/latest?style=flat-square&color=E85D3F)](https://hub.docker.com/r/joyccn/zenroute)
[![GitHub License](https://img.shields.io/github/license/joyccn/ZenRoute?style=flat-square)](https://github.com/joyccn/ZenRoute)
[![GitHub Stars](https://img.shields.io/github/stars/joyccn/ZenRoute?style=flat-square)](https://github.com/joyccn/ZenRoute)

**ZenRoute** is a lightweight, high-performance AI gateway designed to unify, balance, and route model traffic across **OpenAI, Anthropic Claude, Google Gemini, xAI Grok, DeepSeek, Mistral, Ollama, Kiro, Kilo, and custom endpoints** with enterprise-grade resilience and zero latency overhead.

---

## ⚡ Quick Start

### 1. Run with Docker CLI

```bash
docker run -d \
  --name zenroute \
  --restart unless-stopped \
  -p 20128:20128 \
  -v zenroute-data:/app/data \
  joyccn/zenroute:latest
```

Open your browser and navigate to **`http://localhost:20128`** to configure your API keys and provider connections.

---

### 2. Run with Docker Compose (Recommended)

Create a `docker-compose.yml` file:

```yaml
services:
  zenroute:
    image: joyccn/zenroute:latest
    container_name: zenroute
    restart: unless-stopped
    ports:
      - "20128:20128"
    volumes:
      - zenroute-data:/app/data
    environment:
      - DATA_DIR=/app/data
      - PORT=20128
      - HOSTNAME=0.0.0.0
      - NODE_ENV=production

volumes:
  zenroute-data:
    name: zenroute-data
```

Launch the container:

```bash
docker compose up -d
```

---

## 🌐 Endpoints & API Access

ZenRoute exposes standard OpenAI and Anthropic compatible interfaces:

| Purpose | Endpoint URL | Format |
|---------|-------------|--------|
| **Web Dashboard** | `http://localhost:20128` | Interactive UI |
| **OpenAI Compatible API** | `http://localhost:20128/v1` | `chat/completions`, `models`, `embeddings`, `images` |
| **Anthropic Compatible API** | `http://localhost:20128/v1/messages` | Messages API |
| **Health Check** | `http://localhost:20128/api/health` | JSON |

### Quick Test with cURL

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello from ZenRoute!"}]
  }'
```

---

## ✨ Core Features

- 🔄 **Multi-Provider Fallback & Load Balancing**: Transparently failover between providers on 429 rate limits, 5xx server errors, or quota exhaustion.
- 🛡️ **3-Layer Resilience Engine**:
  1. *Provider Circuit Breaker* (opens on 5xx to protect downstream services)
  2. *Key Cooldown Manager* (pauses individual keys on 429 rate limits)
  3. *Model Lockout Buffer* (quarantines broken endpoints without restarting)
- 🧩 **Virtual Combos & Smart Aliases**: Route to auto-optimizing aliases like `auto/coding`, `auto/fast`, and `auto/cheap`.
- 💾 **RTK Token Optimization**: Built-in prompt caching and token saver to minimize API costs.
- 💻 **Seamless CLI & IDE Tool Integration**: Plug directly into **Claude Code**, **Cursor**, **Cline**, **OpenCode**, **Aider**, and **Codex CLI**.
- 🔒 **Self-Hosted & Private**: Runs 100% on your own infrastructure with zero tracking.

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `20128` | Port the web server listens on |
| `HOSTNAME` | `0.0.0.0` | Bind host address |
| `DATA_DIR` | `/app/data` | Persistent SQLite database & config directory |
| `NODE_ENV` | `production` | Node runtime environment |
| `ZENROUTE_PROXY_HTTP` | _none_ | Optional outbound HTTP proxy |
| `ZENROUTE_PROXY_HTTPS` | _none_ | Optional outbound HTTPS proxy |
| `ZENROUTE_MAX_OLD_SPACE_SIZE` | _auto_ | V8 heap memory ceiling in MB (e.g. `2048`) |

---

## 🛠️ CLI & IDE Configuration

### Claude Code
```bash
export ANTHROPIC_BASE_URL="http://localhost:20128/v1"
export ANTHROPIC_API_KEY="your-zenroute-key"
claude
```

### Cursor / Cline / OpenAI SDK
```bash
OPENAI_BASE_URL=http://localhost:20128/v1
OPENAI_API_KEY=your-zenroute-key
```

---

## 🔗 Links & Resources

- **GitHub Repository**: [https://github.com/joyccn/ZenRoute](https://github.com/joyccn/ZenRoute)
- **Documentation**: [https://github.com/joyccn/ZenRoute#readme](https://github.com/joyccn/ZenRoute#readme)
- **Issues & Feedback**: [https://github.com/joyccn/ZenRoute/issues](https://github.com/joyccn/ZenRoute/issues)
