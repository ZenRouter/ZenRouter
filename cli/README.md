# ZenRoute - FREE AI Router & Token Saver

**Never stop coding. Save 20-40% tokens with RTK + auto-fallback to FREE & cheap AI models.**

**Connect All AI Code Tools (Claude Code, Cursor, Antigravity, Copilot, Codex, Gemini, OpenCode, Cline, OpenClaw...) to 40+ AI Providers & 100+ Models.**

[![npm](https://img.shields.io/npm/v/zenroute.svg)](https://www.npmjs.com/package/zenroute)
[![Downloads](https://img.shields.io/npm/dm/zenroute.svg)](https://www.npmjs.com/package/zenroute)
[![Docker Pulls](https://img.shields.io/docker/pulls/joyccn/ZenRoute.svg?logo=docker&label=Docker%20pulls)](https://hub.docker.com/r/joyccn/ZenRoute)
[![GHCR](https://img.shields.io/badge/GHCR-joyccn%2Fzenroute-blue?logo=github)](https://github.com/joyccn/ZenRoute/pkgs/container/zenroute)
[![License](https://img.shields.io/npm/l/zenroute.svg)](https://github.com/joyccn/ZenRoute/blob/main/LICENSE)

<a href="https://trendshift.io/repositories/22628" target="_blank"><img src="https://trendshift.io/api/badge/repositories/22628" alt="joyccn%2Fzenroute | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>

[🌐 Website](https://zenroute.dev) • [📖 Full Docs](https://github.com/joyccn/ZenRoute)

---

## 🤔 Why ZenRoute?

**Stop wasting money, tokens and hitting limits:**

- ❌ Subscription quota expires unused every month
- ❌ Rate limits stop you mid-coding
- ❌ Tool outputs (git diff, grep, ls...) burn tokens fast
- ❌ Expensive APIs ($20-50/month per provider)

**ZenRoute solves this:**

- ✅ **RTK Token Saver** - Auto-compress tool_result, save 20-40% tokens
- ✅ **Maximize subscriptions** - Track quota, use every bit before reset
- ✅ **Auto fallback** - Subscription → Cheap → Free, zero downtime
- ✅ **Multi-account** - Round-robin between accounts per provider
- ✅ **Universal** - Works with any OpenAI/Claude-compatible CLI

---

## ⚡ Quick Start

**Option 1 — npm (recommended for desktop):**

```bash
npm install -g zenroute
zenroute

# Or run directly with npx
npx zenroute
```

**Option 2 — Docker (server/VPS):**

```bash
docker run -d --name zenroute -p 20128:20128 \
  -v "$HOME/.zenroute:/app/data" -e DATA_DIR=/app/data \
  joyccn/ZenRoute:latest
```

Published images: [Docker Hub](https://hub.docker.com/r/joyccn/ZenRoute) • [GHCR](https://github.com/joyccn/ZenRoute/pkgs/container/zenroute) (multi-platform amd64/arm64).

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
zenroute                    # Start with default settings
zenroute --port 8080        # Custom port
zenroute --no-browser       # Don't open browser
zenroute --skip-update      # Skip auto-update check
zenroute --help             # Show all options
```

**Dashboard**: `http://localhost:20128/dashboard`

### Memory limit

The server process uses a 6 GB V8 heap cap by default. On a memory-limited host,
set a lower cap or let Node size it from the available memory:

```bash
ZENROUTE_MAX_OLD_SPACE_SIZE=384 zenroute
ZENROUTE_MAX_OLD_SPACE_SIZE=0 zenroute
```

An existing `NODE_OPTIONS=--max-old-space-size=...` value is respected.

---

## 🛠️ Supported CLI Tools

Claude-Code • OpenClaw • Codex • OpenCode • Cursor • Antigravity • Cline • Continue • Droid • Roo • Copilot • Kilo Code • Gemini CLI • Qwen Code • iFlow • Crush • Crusher • Aider

Any tool supporting OpenAI/Claude-compatible API works.

---

## 💾 Data Location

- **macOS/Linux**: `~/.zenroute/db/data.sqlite`
- **Windows**: `%APPDATA%/zenroute/db/data.sqlite`
- **Docker**: `/app/data/db/data.sqlite` (mount `$HOME/.zenroute` to persist)

---

## 📚 Documentation

Full docs, advanced setup, video tutorials & development guide:

- **GitHub**: https://github.com/joyccn/ZenRoute
- **Full README**: https://github.com/joyccn/ZenRoute/blob/main/app/README.md
- **Website**: https://zenroute.dev

---

## 🙏 Acknowledgments

- **[CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI)** - Original Go implementation

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
