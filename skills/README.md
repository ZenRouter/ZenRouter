# ZenRouter — Agent Skills

Drop-in skills for any AI agent (Claude, Cursor, ChatGPT, custom SDK). Just **copy a link** below and paste it to your AI — it will fetch the skill and use ZenRouter for you.

> Tip: start with the **zenrouter** entry skill — it covers setup and links to all capability skills.

## Skills

| Capability | Copy link below and paste to your AI |
|---|---|
| **Entry / Setup** (start here) | https://raw.githubusercontent.com/ZenRouter/ZenRouter/refs/heads/master/skills/zenrouter/SKILL.md |
| Chat / code-gen | https://raw.githubusercontent.com/ZenRouter/ZenRouter/refs/heads/master/skills/zenrouter-chat/SKILL.md |
| Image generation | https://raw.githubusercontent.com/ZenRouter/ZenRouter/refs/heads/master/skills/zenrouter-image/SKILL.md |
| Video generation (xAI Grok Imagine) | https://raw.githubusercontent.com/ZenRouter/ZenRouter/refs/heads/master/skills/zenrouter-video/SKILL.md |
| Text-to-speech | https://raw.githubusercontent.com/ZenRouter/ZenRouter/refs/heads/master/skills/zenrouter-tts/SKILL.md |
| Speech-to-text | https://raw.githubusercontent.com/ZenRouter/ZenRouter/refs/heads/master/skills/zenrouter-stt/SKILL.md |
| Embeddings | https://raw.githubusercontent.com/ZenRouter/ZenRouter/refs/heads/master/skills/zenrouter-embeddings/SKILL.md |
| Web search | https://raw.githubusercontent.com/ZenRouter/ZenRouter/refs/heads/master/skills/zenrouter-web-search/SKILL.md |
| Web fetch (URL → markdown) | https://raw.githubusercontent.com/ZenRouter/ZenRouter/refs/heads/master/skills/zenrouter-web-fetch/SKILL.md |

## How to use

Paste to your AI (Claude, Cursor, ChatGPT, …):

```
Read this skill and use it: https://raw.githubusercontent.com/ZenRouter/ZenRouter/refs/heads/master/skills/zenrouter/SKILL.md
```

Then ask normally — *"generate an image of a cat"*, *"transcribe this URL"*, etc.

## Configure your shell once

```bash
export ZENROUTER_URL="http://localhost:20128"   # local default, or your VPS / tunnel URL
export ZENROUTER_KEY="sk-..."                   # from Dashboard → Keys (only if requireApiKey=true)
```

Verify: `curl $ZENROUTER_URL/api/health` → `{"ok":true}`.

## Links

- Source: https://github.com/ZenRouter/ZenRouter
- Dashboard: https://zenrouter.com
