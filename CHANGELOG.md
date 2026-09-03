# Changelog

All notable changes to ZenRouter (fork of 9Router) will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/) and Conventional Commits.

## [Unreleased]

### Added / Fixed

#### Dashboard & Models / Custom Capabilities on Custom OAI & Compatible Nodes (#3752, upstream 38f031f4c)
- **feat(models): capability toggles, tune button, and upsert for custom and compatible models (fixes #3752)**
  - Added capability toggles (Vision, Reasoning) to `AddCustomModelModal` with whitelist sanitization in `POST /api/models/custom`.
  - Added retroactive capability configuration (`tune` icon button) to `CompatibleModelRow` and `ModelRow`, allowing capabilities on custom OpenAI-compatible, Anthropic-compatible, and default provider models to be customized in-place without deleting and re-adding.
  - Updated `addCustomModel` in `src/lib/db/repos/aliasRepo.js` to perform atomic upsert, merging capability updates with existing metadata.
  - Included custom models with their explicit capability overrides in `GET /api/models`.
  - Added live cache invalidation via `customModelChanged` event in `src/shared/hooks/useModelCaps.js`.
  - Added unit test suite in `tests/unit/custom-model-capabilities-3752.test.js`.

#### Networking & Billing / Bun Client Disconnect Abort (#3559)
- **fix(stream,server): bridge client TCP socket close into ServerResponse on Bun & Node (fixes #3559)**
  - Bridged incoming socket `close` and `aborted` events in `custom-server.js` directly to `res.emit('close')` and `res.destroy()` when the response is unfinished (`!res.writableFinished && !res.writableEnded`).
  - Enables Bun compatibility where `ServerResponse` never natively emits `close`, resolving the defect where client hangup failed to propagate to Next's `request.signal`.
  - Upstream requests are immediately aborted and partial usage recorded, stopping token waste and continuous billing when clients disconnect mid-stream.
  - Added regression test suite in `tests/unit/custom-server-socket.test.js`.

#### Performance pool — L1 caches, zero-mutation stream, models TTL (upstream PR #3629)
- **perf(stream): accumulate content/thinking in chunk arrays** in `open-sse/utils/stream.js` (`contentChunks`/`thinkingChunks` + single `join("")`), cutting per-chunk string GC pressure; split-packet handling kept index-based.
- **perf(db): L1 caches for API keys and connections** in `src/lib/db/repos/apiKeysRepo.js` (`apiKeyCache` + negative cache) and `connectionsRepo.js` (`connectionCache` per filter) with `invalidate*Cache()` on every mutation. Settings keeps Zen's 2s TTL raw cache (better than upstream's unbounded merged cache); usage keeps Zen's object-identity dedup (no field-equality scan, so no `idx_uh_dedup`/schema bump needed).
- **perf(models): 30s TTL + `Cache-Control: public, max-age=30, stale-while-revalidate=60`** in `src/app/api/v1/models/route.js` for agent `/v1/models` polling storms.
- **test:** new `tests/unit/performance-optimizations.test.js` (14 tests, hardened Zen port of upstream's 11 — TTL semantics, negative cache, per-filter isolation, 50-chunk join, object-identity dedup).
- **docs:** `docs/ARCHITECTURE.md` SQLite paths corrected (`data.sqlite`, `usageHistory`/`usageDaily`); `open-sse/AGENTS.md` perf conventions documented.

## [0.5.63] - 2026-09-03

### Fixed

#### OpenAI Models / Max Completion Tokens & Streaming Reasoning (PR #3657, PR #3601)
- **fix(translator): emit `max_completion_tokens` for gpt-5/o-series in *-to-openai request builders (PR #3657)**
  - Hoisted `requiresMaxCompletionTokens` check (`/gpt-5|o[134]-/i`) in `open-sse/translator/formats/maxTokens.js`.
  - Updated `claudeToOpenAIRequest`, `geminiToOpenAIRequest`, and `antigravityToOpenAIRequest` to emit `max_completion_tokens` instead of `max_tokens`, preventing HTTP 400 rejection from OpenAI Chat Completions.
- **fix(stream): keep `delta.reasoning` in streaming passthrough & accumulate thinking (PR #3601)**
  - Extended `hasValuableContent` in `open-sse/utils/streamHelpers.js` to recognize `delta.reasoning`.
  - Accumulated `delta.reasoning` in `totalContentLength` and `accumulatedThinking` in `open-sse/utils/stream.js` so reasoning tokens from providers like Ollama/DeepSeek are neither dropped nor under-counted.

#### Model Patterns & CommandCode / GLM-5.3-Flash & DeepSeek-V4-Vision (PR #3618, Issue #3753)
- **feat(capabilities): update GLM 5.3 context window and add multimodal vision patterns (PR #3618, Issue #3753)**
  - Updated `*glm-5.3*` context window to 1M with 131k output limit, and added multimodal `*glm-5.3-flash*` (vision, video, pdf, thinking) to `open-sse/providers/capabilities.js`.
  - Added `*deepseek-v4*vision*` pattern to declare vision capability for `deepseek-v4-flash-vision-exp`.
  - Added `z-ai/glm-5.3-flash` and `deepseek/deepseek-v4-flash-vision-exp` to `open-sse/providers/registry/commandcode.js`.

#### Tool Calling & Combo Autoswitch / OpenRouter Schema Sanitizer & Tools Detection (PR #3665)
- **fix(tools): normalize OpenRouter function tool schemas and detect tools in combo auto-switch (PR #3665)**
  - Added `open-sse/utils/toolSchemaCompatibility.js` to strip invalid regex `pattern` constraints from tool parameter schemas before OpenRouter dispatch.
  - Added function tool detection in `open-sse/services/combo.js:detectRequiredCapabilities` so combos float tool-capable models first when requests declare function tools.

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

#### Networking & Proxy / SOCKS5 Warnings (#3744, PR #3745)
- **fix(proxy): suppress undici SOCKS5 ExperimentalWarning and downgrade ProxyFetch fallback logs**
  - Suppressed Node undici `ExperimentalWarning: SOCKS5 proxy support is experimental and subject to change` in `custom-server.js` and `bootstrap.js`.
  - Downgraded `[ProxyFetch] Proxy failed, falling back to direct` logs from `warn` to `debug` in `open-sse/utils/proxyFetch.js` to eliminate log journal spam when direct fallback succeeds.

#### Kiro / MITM Inline Image Forwarding (PR #3734)
- **fix(kiro): forward inline images as OpenAI `image_url` parts in MITM handler**
  - Extracted attached images from `userInputMessage.images` and converted them into OpenAI-compatible `image_url` data URIs with proper MIME mapping in `src/mitm/handlers/kiro.js`.
  - Supported image-only turns and historical turn image preservation.
  - Added `.kiro/` workspace ignore in `.gitignore`.

#### Docker & Standalone / Rate Limit Status (#3712)
- **fix(docker): bundle `node-machine-id` into standalone Docker image and return 503 for rate-limited providers**
  - Explicitly copied `node_modules/node-machine-id` into standalone image in `Dockerfile`, preventing dynamic require runtime failures.
  - Updated `src/sse/handlers/chat.js` to always return `503 Service Unavailable` instead of echoing stale 500 error codes from the database when all accounts are rate-limited.
  - Added `*.tgz` to `.gitignore`.

#### Context & Quota Optimization / Model Context & Remaining-First Selection (#3740, #3750)
- **feat(quota): remaining-first OAuth account selection for Claude and Codex (PR #3740)**
  - Created `src/sse/services/quotaAwareSelection.js` and wired remaining-first account selection into `src/sse/services/auth.js`.
  - Automatically sorts Claude and Codex OAuth accounts by remaining session quota (highest first) before fill-first / round-robin selection.
  - Skips accounts with exhausted blocking (e.g. weekly) quotas and returns `allRateLimited` when all accounts are blocked.
  - Added `quotaAwareSelection`, `quotaCacheTtlMs`, and `quotaAwareProviders` to settings repository and route whitelists.
- **fix(models): propagate context window and max tokens from live catalog and custom models (#3750)**
  - Updated `src/shared/utils/providerLiveModels.js` to preserve `context_length` / `max_completion_tokens` as `capabilities` from upstream `/models` responses.
  - Updated `src/app/api/v1/models/route.js` to propagate `context_length` and `max_completion_tokens` for live models, custom models, and custom combo limits, allowing downstream agents (e.g. CLI tools) to perform accurate compaction.

#### Dashboard UI/UX / Provider Status Filter & Compact Token Display (PR #3704, PR #3747)
- **feat(providers): add connection status filter to providers dashboard (PR #3704)**
  - Added `STATUS_FILTER_OPTIONS`, `getConnectionStatus`, and `matchesStatusFilter` in `src/app/(dashboard)/dashboard/providers/utils.js`.
  - Added client-side status filter dropdown (All / Active / Inactive / No connection) to `src/app/(dashboard)/dashboard/providers/page.js` across OAuth, Free, Free Tier, API Key, and Custom Compatible providers.
  - Always treats `noAuth` free providers as Active rather than "No connection".
- **feat(usage): compact notation for large token counts (>100k) and observability callouts (PR #3747)**
  - Created reusable formatting utilities in `src/shared/utils/format.js` with `fmtCompact` using en-US compact notation (`100K`, `1.5M`, `2B`) for token counts >= 100k.
  - Applied `fmtCompact` with full-count tooltip hover in `OverviewCards.js`, `RecentRequests` in `UsageStats.js`, and `UsageTable.js`.
  - Updated `/api/settings` GET endpoint with `enableRequestLogsDefined` and `observabilityEnabled`.
  - Fixed loading state `colSpan` (7 → 9) in `RequestDetailsTab.js` and surfaced environment vs database settings precedence.
  - Updated snapshot for Claude 2.1.257 User-Agent header in `golden-url-header.test.js`.

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
