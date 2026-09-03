# Changelog

All notable changes to ZenRouter (fork of 9Router) will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/) and Conventional Commits.

## [0.5.62] - 2026-09-03

### Fixed

#### Gemini & Antigravity / MCP Schema Cleaner (#2884, #3743)
- **fix(translator): preserve parameters named `properties` / `title` and strip `prefixItems` for Gemini API**
  - Differentiated JSON schema definition nodes from property name maps (`schema.properties`) by threading `isSchema` context in `removeUnsupportedKeywords` and `ensureObjectType`.
  - Prevented invalid `type: "object"` injection into `schema.properties.type` when tools declare a parameter literally named `properties` (e.g. official Notion MCP tools), and preserved parameters named `title`, `default`, `format`.
  - Added JSON Schema 2020-12 `prefixItems` to `UNSUPPORTED_SCHEMA_CONSTRAINTS` to prevent Gemini rejection on tuple-formatted tools.

#### Kiro / Thinking Protocol (#3641, #3746, #3749)
- **fix(kiro): strip generic top-level thinking fields before dispatch**
  - Stripped `thinking`, `reasoning`, `reasoning_effort`, `thinkingConfig`, `enable_thinking`, `output_config`, and `think` in `KiroExecutor.transformRequest`.
  - Prevents AWS Bedrock / Kiro `400 REQUEST_BODY_INVALID` when non-Claude clients (Responses API or Gemini) send thinking or reasoning parameters to Kiro models.

#### OpenCode / Muse Spark 1.3 & Vision (#3738, #3739)
- **fix(opencode): route Muse Spark 1.3 to Responses API and declare vision capability**
  - Added `muse-spark-1.3-contributor-free` to `RESPONSES_MODELS` and `providerModels.js`, ensuring requests target `/zen/v1/responses` rather than `/chat/completions`.
  - Marked `muse-spark-1.2-contributor-free` and `muse-spark-1.3-contributor-free` with `vision: true` in `PROVIDER_CAPABILITIES` so inline images are not stripped.

#### Claude / Fable 5.1 & Client Spoofing (#3719)
- **feat(claude): support Claude Fable 5.1 and bump spoofed CLI version**
  - Updated `CLAUDE_CODE_VERSION` in `open-sse/config/clientVersions.js` to `2.1.257`.
  - Added `claude-fable-5-1` to `open-sse/providers/registry/claude.js` and `open-sse/providers/pricing.js`.
  - Configured `*claude*fable*` with `thinkingFormat: "claude-adaptive"`.

## [0.5.60] - 2026-08-30

### Fixed

#### Antigravity & Gemini-CLI / Proxy Support
- **fix(antigravity): pass connection proxy options to GCP project ID discovery and token refresh**
  - Resolved `400 FAILED_PRECONDITION: User location is not supported for the API use` when using proxies with Antigravity / Gemini-CLI models (e.g. `gemini-3.7-flash-high`).
  - `open-sse/services/projectId.js`, `open-sse/services/tokenRefresh/providers.js`, and `src/sse/services/tokenRefresh.js` now route `loadCodeAssist`, `onboardUser`, and Google OAuth token refresh requests through `proxyAwareFetch` with connection-level `proxyOptions`, preventing domestic IP leakage.
  - `src/sse/handlers/chat.js` and `open-sse/executors/gemini-cli.js` forward connection proxy settings dynamically.

#### Claude Code / Non-Streaming Contract (#3462)
- **fix(translator): enforce Anthropic `type: "message"` response shape on non-streaming `/v1/messages`**
  - `open-sse/handlers/chatCore/nonStreamingHandler.js`: When client source format is Claude (such as Claude Code's non-streaming permission classifier / prompt security requests), responses from OpenAI/Gemini/Ollama upstreams are translated into Anthropic message structures (`type: "message"`, `role: "assistant"`, `content: [...]`) rather than leaking `chat.completion` objects.

#### Kiro / AWS Tool Schema (#3641)
- **fix(kiro): recursively flatten `anyOf`, `oneOf`, `allOf`, and type arrays in tool schemas**
  - `open-sse/translator/concerns/kiroConversation.js`: Added recursive schema normalization that merges `allOf`, picks valid non-null schemas from `anyOf`/`oneOf`, collapses type arrays (`["string", "null"]` → `"string"`), and strips unsupported JSON schema keywords (`$schema`, `title`, `additionalProperties`) to eliminate `400 REQUEST_BODY_INVALID` errors.

#### CommandCode / Error Interception (#3636)
- **fix(commandcode): add retryable error definitions for stream error interception**
  - `open-sse/config/errorConfig.js`: Added `[commandcode error` matching rules to prevent transient stream errors from breaking the retry loop.

#### CLI / Autostart (#3628)
- **fix(cli): respect autostart disable — `hide` no longer force-enables autostart**
  - `cli/cli.js:781` previously called `enableAutoStart()` unconditionally on Hide-to-Tray, recreating `zenrouter.vbs` / `com.zenrouter.autostart.plist` after user deleted it or disabled via tray menu. Now autostart is opt-in via tray menu only (`cli/src/cli/tray/tray.js:98` toggle). Verified that no other launch path recreates the file.

#### Stability / Fallback (#3602)
- **fix(fallback): handle AiHubMix abuse-prevention error as quota exhaustion**
  - `open-sse/config/errorConfig.js:73` added text rules `prevent abuse` and `can only try` → `COOLDOWN.extended` (15m) so `Sorry, to prevent abuse of free resources...` triggers account rotation instead of 30s transient. Verified via `checkFallbackError(403, abuseText)` returns `cooldownMs: 900000`.

#### UI/UX (#3427, #3249)
- **fix(ui): clarify observability disabled state in Usage Details**
  - `src/app/(dashboard)/dashboard/usage/components/RequestDetailsTab.js` now fetches `enableObservability` and shows actionable empty-state with link to `Profile → Observability` and `OBSERVABILITY_ENABLED=true` hint when disabled, instead of silent “No request details found”.
  - Fixed `colSpan` 7→9 to match header count.
  - `src/app/(dashboard)/dashboard/profile/page.js:1618` improved toggle description to explain that Details tab stays empty when disabled.
  - `src/lib/db/repos/requestDetailsRepo.js:181` already has correct `LIMIT/OFFSET` pagination; `src/lib/db/repos/usageRepo.js` ring caps (`RING_CAP=50`) are intentional in-memory window, not the old `LIMIT 100` bug.

#### Security (#3630)
- **fix(security): harden SSRF guard against alt IP encodings & DNS rebinding**
  - `src/shared/utils/ssrfGuard.js`
    - Blocks decimal `2130706433`, hex `0x7f000001`, octal `0177.0.0.1`, mixed `0x7f.0.0.1` via `parseAlternativeIpv4()` / `isBlockedAlternativeIpv4()`
    - Extends IPv6 to cover site-local `fec0::/10`, hex-mapped `::ffff:7f00:1` (in addition to existing `fe80::`, `fc00::/7`, `ff00::/8`)
    - Blocks DNS rebinding hosts `*.nip.io`, `*.sslip.io`, `*.xip.io`, `localtest.me`
  - Verified `assertPublicUrl()` now blocks all 9 test vectors and still allows `http://google.com/`.
  - Existing `assertPublicUrlAsync()` DNS-lookup rebinding protection already present and preserved.

#### Performance (#3629)
- **perf: per-provider mutex, socket leak fix, stream & settings cache**
  - `src/sse/services/auth.js:10` replaced global `selectionMutex` with `providerMutexes: Map<providerId, Promise>` so concurrent Claude + Codex + OpenAI requests no longer serialize.
  - `open-sse/utils/proxyFetch.js:285` destroys evicted `ProxyAgent` on LRU eviction (`oldest.destroy()/close()`) and sets `keepAliveTimeout: 30s` to prevent FD leak.
  - `open-sse/utils/stream.js:133` uses `indexOf("\n")` loop instead of `split("\n")` to avoid intermediate array allocs.
  - `src/lib/db/repos/settingsRepo.js:67` adds 2s L1 cache for `readRaw()` with invalidation on `updateSettings()` to cut 2-3 DB reads per `/v1` request.

#### Kimi K3 / NVIDIA (#kimi-k3)
- **fix(kimi): auto-clamp thinking_effort for NVIDIA Kimi K3**
  - `open-sse/providers/thinkingLevels.js:38` add provider-specific `nvidia/*kimi*k3* → [low,high,max]` (no `medium`), previously `[low,medium,high,max]` caused `400 Unsupported Kimi K3 thinking_effort="medium"`.
  - `open-sse/translator/concerns/thinkingUnified.js:309` kimi case now respects `supportedLevels` and clamps `medium→high`, `minimal→low`, `xhigh→max`; verified `nvidia/kimi-k3 medium→high`, `low→low`, `tokenrouter/kimi-k3 medium→medium`.
  - Live logs at `zen.hlcyn.xyz` showed loop over 19 keys ×20s due to same 400; now first account succeeds via auto-clamp, no fallback loop.

### Verified
- `checkFallbackError` returns 15m for AiHubMix strings ✅
- `assertPublicUrl` blocks 10 SSRF vectors, allows public host ✅
- `node --check` passes for all 4 changed modules ✅
- `vitest run unit/circuit-breaker-balance`, `antigravity-quota-routing`, `commandcode-error-detect`, `aborted-stream-usage-3488` all green ✅
- `eslint` clean on changed files ✅

## [0.5.59] - 2026-08-30 (upstream + fork)
- See `git log upstream/master..HEAD` for 163 commits ahead of `decolua/9router v0.5.55 (699edac3)`. Notable prior fixes in this fork:
  - `714756c1` Gemini MCP tool collision dedup (#3622)
  - `509b7632` Combo payload clone + peek timeout (#3619)
  - `f832e902` Bun disconnect + TTFT watchdog (#3559)
  - `50093fcc` Aborted stream usage + omitted stream JSON (#3488, #3492)
  - `c7adcaec` Empty stream failover + CommandCode 503 (#3463, #3468)
  - `b36deb46` CSP hardening (#3630 partial)
