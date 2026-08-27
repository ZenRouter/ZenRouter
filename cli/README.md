# ZenRouter - FREE AI Router & Token Saver

**Never stop coding. Save 20-40% tokens with RTK + auto-fallback to FREE & cheap AI models.**

**Connect All AI Code Tools (Claude Code, Cursor, Antigravity, Copilot, Codex, Gemini, OpenCode, Cline, OpenClaw...) to 40+ AI Providers & 100+ Models.**

[![npm](https://img.shields.io/npm/v/zenrouter.svg)](https://www.npmjs.com/package/zenrouter)
[![Downloads](https://img.shields.io/npm/dm/zenrouter.svg)](https://www.npmjs.com/package/zenrouter)
[![Docker Pulls](https://img.shields.io/docker/pulls/zenrouter/zenrouter.svg?logo=docker&label=Docker%20pulls)](https://hub.docker.com/r/zenrouter/zenrouter)
[![GHCR](https://img.shields.io/badge/GHCR-ZenRouter%2FZenRouter-blue?logo=github)](https://github.com/ZenRouter/ZenRouter/pkgs/container/zenrouter)
[![License](https://img.shields.io/npm/l/zenrouter.svg)](https://github.com/ZenRouter/ZenRouter/blob/main/LICENSE)

<a href="https://trendshift.io/repositories/22628" target="_blank"><img src="https://trendshift.io/api/badge/repositories/22628" alt="ZenRouter%2FZenRouter | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>

[📖 Full Documentation](https://github.com/ZenRouter/ZenRouter)

---

## 🤔 Why ZenRouter?

**Stop wasting money, tokens and hitting limits:**

- ❌ Subscription quota expires unused every month
- ❌ Rate limits stop you mid-coding
- ❌ Tool outputs (git diff, grep, ls...) burn tokens fast
- ❌ Expensive APIs ($20-50/month per provider)

**ZenRouter solves this:**

- ✅ **RTK Token Saver** - Auto-compress tool_result, save 20-40% tokens
- ✅ **Maximize subscriptions** - Track quota, use every bit before reset
- ✅ **Auto fallback** - Subscription → Cheap → Free, zero downtime
- ✅ **Multi-account** - Round-robin between accounts per provider
- ✅ **Universal** - Works with any OpenAI/Claude-compatible CLI

---

## ⚡ Quick Start

**Option 1 — npm (recommended for desktop):**

```bash
npm install -g zenrouter
zenrouter

# Or run directly with npx
npx zenrouter
```

**Option 2 — Docker (server/VPS):**

```bash
docker run -d --name zenrouter -p 20128:20128 \
  -v "$HOME/.zenrouter:/app/data" -e DATA_DIR=/app/data \
  zenrouter/zenrouter:latest
```

Published images: [Docker Hub](https://hub.docker.com/r/zenrouter/zenrouter) • [GHCR](https://github.com/ZenRouter/ZenRouter/pkgs/container/zenrouter) (multi-platform amd64/arm64).

🎉 Dashboard opens at `http://localhost:20128`

**2. Connect a FREE provider (no signup needed):**

Dashboard → Providers → Connect **Kiro AI** (free Claude unlimited) or **OpenCode Free** (no auth) → Done!

**3. Use in your CLI tool:**

```
Claude Code/Codex/OpenClaw/Cursor/Cline Settings:
  Endpoint: http://localhost:20128/v1
  API Key:  [copy from dashboard]
  Model:    kr/claude-sonnet-4.5
```

That's it! Start coding with FREE AI models.

---

## 🚀 CLI Options

```bash
zenrouter                    # Start with default settings
zenrouter --port 8080        # Custom port
zenrouter --no-browser       # Don't open browser
zenrouter --skip-update      # Skip auto-update check
zenrouter --help             # Show all options
```

**Dashboard**: `http://localhost:20128/dashboard`

### Memory limit

The server process uses a 6 GB V8 heap cap by default. On a memory-limited host,
set a lower cap or let Node size it from the available memory:

```bash
ZENROUTER_MAX_OLD_SPACE_SIZE=384 zenrouter
ZENROUTER_MAX_OLD_SPACE_SIZE=0 zenrouter
```

An existing `NODE_OPTIONS=--max-old-space-size=...` value is respected.

---

## 🛠️ Supported CLI Tools

Claude-Code • OpenClaw • Codex • OpenCode • Cursor • Antigravity • Cline • Continue • Droid • Roo • Copilot • Kilo Code • Gemini CLI • Qwen Code • iFlow • Crush • Crusher • Aider

Any tool supporting OpenAI/Claude-compatible API works.

---

## 💾 Data Location

- **macOS/Linux**: `~/.zenrouter/db/data.sqlite`
- **Windows**: `%APPDATA%/zenrouter/db/data.sqlite`
- **Docker**: `/app/data/db/data.sqlite` (mount `$HOME/.zenrouter` to persist)

---

## 📚 Documentation

Full docs, advanced setup, video tutorials & development guide:

- **GitHub**: https://github.com/ZenRouter/ZenRouter
- **Full README**: https://github.com/ZenRouter/ZenRouter/blob/main/README.md

---

## 🙏 Acknowledgments

- **[CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI)** - Original Go implementation

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
