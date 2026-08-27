---
name: zenrouter
description: Entry point for ZenRouter — local/remote AI gateway with OpenAI-compatible REST for chat, image, TTS, embeddings, web search, web fetch. Use when the user mentions ZenRouter, ZENROUTER_URL, or wants AI without writing provider boilerplate. This skill covers setup + indexes capability skills; fetch the relevant capability SKILL.md from the URLs below when needed.
---

# ZenRouter

Local/remote AI gateway exposing OpenAI-compatible REST. One key, many providers, auto-fallback.

## Setup

```bash
export ZENROUTER_URL="http://localhost:20128"      # or VPS / tunnel URL
export ZENROUTER_KEY="sk-..."                      # from Dashboard → Keys (only if requireApiKey=true)
```

All requests: `${ZENROUTER_URL}/v1/...` with header `Authorization: Bearer ${ZENROUTER_KEY}` (omit if auth disabled).

Verify: `curl $ZENROUTER_URL/api/health` → `{"ok":true}`

## Discover models

```bash
curl $ZENROUTER_URL/v1/models                  # chat/LLM (default)
curl $ZENROUTER_URL/v1/models/image            # image-gen
curl $ZENROUTER_URL/v1/models/tts              # text-to-speech
curl $ZENROUTER_URL/v1/models/embedding        # embeddings
curl $ZENROUTER_URL/v1/models/web              # web search + fetch (entries have `kind` field)
curl $ZENROUTER_URL/v1/models/stt              # speech-to-text
curl $ZENROUTER_URL/v1/models/image-to-text    # vision
```

Use `data[].id` as `model` field in requests. Combos appear with `owned_by:"combo"`.

Response shape:
```json
{ "object": "list", "data": [
  { "id": "openai/gpt-5", "object": "model", "owned_by": "openai", "created": 1735000000 },
  { "id": "tavily/search", "object": "model", "kind": "webSearch", "owned_by": "tavily", "created": 1735000000 }
]}
```

## Capability skills

When the user needs a specific capability, fetch that skill's `SKILL.md` from its raw URL:

| Capability | Raw URL |
|---|---|
| Chat / code-gen | https://raw.githubusercontent.com/ZenRouter/ZenRouter/refs/heads/master/skills/zenrouter-chat/SKILL.md |
| Image generation | https://raw.githubusercontent.com/ZenRouter/ZenRouter/refs/heads/master/skills/zenrouter-image/SKILL.md |
| Text-to-speech | https://raw.githubusercontent.com/ZenRouter/ZenRouter/refs/heads/master/skills/zenrouter-tts/SKILL.md |
| Speech-to-text | https://raw.githubusercontent.com/ZenRouter/ZenRouter/refs/heads/master/skills/zenrouter-stt/SKILL.md |
| Embeddings | https://raw.githubusercontent.com/ZenRouter/ZenRouter/refs/heads/master/skills/zenrouter-embeddings/SKILL.md |
| Web search | https://raw.githubusercontent.com/ZenRouter/ZenRouter/refs/heads/master/skills/zenrouter-web-search/SKILL.md |
| Web fetch (URL → markdown) | https://raw.githubusercontent.com/ZenRouter/ZenRouter/refs/heads/master/skills/zenrouter-web-fetch/SKILL.md |

## Errors

- 401 → set/refresh `ZENROUTER_KEY` (Dashboard → Keys)
- 400 `Invalid model format` → check `model` exists in `/v1/models/<kind>`
- 503 `All accounts unavailable` → wait `retry-after` or add another provider account
