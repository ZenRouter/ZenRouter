# Changelog

All notable changes to ZenRouter (fork of 9Router) will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/) and Conventional Commits.

## [Unreleased]

### Fixed

- **fix(auth): treat OAuth org-denial 403 as permanent, skip refresh storm**
  - Classifies `oauth_not_allowed_for_organization` / `oauth_org_not_allowed` / org-disabled 403s as `terminal: true` with 15m cooldown (per Anthropic docs this is server-side org policy — refresh can never heal it).
  - `chatCore` peeks the cloned error body and skips the 3x token-refresh + retry for permanent denials; the account is still locked and fallback proceeds once to the next account instead of N accounts × 4 upstream hits.
  - New shared `isPermanentAuthDenial()` helper + `tests/unit/account-fallback-oauth-denial.test.js`.
- **fix(pricing): exact current Claude prices, correct Haiku alias**
  - Adds `MODEL_PRICING` for `claude-opus-5` (5/25), `claude-opus-5-5` + dated snapshot + dot alias (4/20, cache reads 5%), `claude-sonnet-5` (2/10); previously fell through to the 5/25 and 3/15 patterns.
  - Fixes `claude-haiku-4.5` dot alias (was 0.5/2.5, now 1/5 matching the dated snapshot and official pricing).
- **fix(provider): refresh anthropic API-key registry to current lineup**
  - Adds Opus 5.5 / Opus 5 / Sonnet 5 / Haiku 4.5 / Fable 5.1 / Opus-Sonnet 4.6; keeps legacy dated IDs and plain API-key headers (no CLI fingerprint spoofing on this path).
- **fix(translator): surface Claude mid-stream error events**
  - `claude-to-openai` converts SSE `error` events (e.g. `overloaded_error`) into terminal content + STOP instead of swallowing them; inbound `ping` explicitly ignored.
- **fix(stream): carry abort cause into terminal bytes**
  - `pipeWithDisconnect` tracks `abortMessage` (upstream loss vs TTFT vs stall timeout) into `onAbortTerminal`, porting upstream 9Router diagnostics for undistinguishable terminal failures.
  - New `tests/unit/stream-stall-cancels-upstream.test.js` proves the kill chain: watchdog fires once, AbortSignal aborts, errored body unblocks the hung pull, downstream closes gracefully.

### Known limitations
- Preserved-thinking `signature_delta` is not forwarded across the OpenAI bridge (OpenAI has no signature field); multi-turn thinking replay across providers may 400 on Fable 5.1 / Opus 5.5 for post-2026-08-31 accounts.

## [0.7.3] - 2026-09-20

### Changed / Reverted

#### Standard 9Router OAuth Architecture Alignment
- **revert(oauth): restore standard upstream 9Router OAuth flow and modal behavior**
  - Reverted experimental tunnel/public domain OAuth callback routing in `OAuthModal.js` and `/api/oauth/[provider]/[action]/route.js`.
  - Restored 100% standard upstream 9Router behavior: loopback port callback bindings (`http://localhost:${appPort}/callback`, fixed ports for Codex 1455 and xAI 56121), direct popup/manual paste fallbacks, and upstream route validation.
  - Eliminated callback URI mismatch errors (`Redirect URI is not supported by client`) caused by custom public domain redirections on installed-app clients (Claude Code CLI, Google Antigravity/Gemini).

## [0.7.2] - 2026-09-20

### Added / Fixed

#### Stream & SSE Enhancements
- **fix(stream): synthesize terminal chunk on streams ending without finish_reason and log tool calls (#4079, #4080)**
  - When an upstream SSE stream terminates without a `finish_reason`, synthesizes a terminal chunk (`finish_reason: "network_error"`) followed by `data: [DONE]` so clients like `pi` and agentic harnesses close the turn as a deliberate error instead of crashing.
  - Accumulates streamed tool calls (both OpenAI and Claude shapes) into completion callbacks to eliminate deceptive `[Empty streaming response]` log records.
- **fix(stream): preserve and symmetrically populate `delta.reasoning` and `delta.reasoning_content` (#4082)**
  - Downstream coding agents like Cline and OpenRouter SDK clients read reasoning chunks under `delta.reasoning`, while DeepSeek and newer models stream under `delta.reasoning_content`. Symmetrically populates both fields without stripping either, allowing all clients to render model thinking traces.

#### Gateway & Routing Reliability

- **fix(models): expose token limits and context length on combo entries in `/v1/models` (#3486, #4096)**
  - Derives `context_length` and `max_completion_tokens` from combo members (taking the safe minimum envelope across members) so clients like Claude Code, Codex, and Cline do not prematurely trigger compacting loops. Supports both string and object member references.
- **fix(errors): forward `Retry-After` header and classify terminal billing errors (#4147)**
  - Synthesizes and forwards `Retry-After: <seconds>` headers on 429 rate limit error responses to prevent client hammering.
  - Classifies permanent billing errors (`余额不足`, `请充值`, `insufficient balance`, HTTP 402) as `terminal: true` to halt futile retry loops.
- **fix(combos): preserve explicit Fallback strategy override on combos (#4094)**
  - When explicitly selecting Fallback on a combo, the override is now persisted rather than pruned from `comboStrategies`, preventing combos from silently inheriting the global Round Robin routing strategy.
- **fix(api): default `stream` to `false` when omitted on `/v1/chat/completions` (#4122)**
  - Adheres strictly to OpenAI Chat Completions API specification where `stream` defaults to `false`. Requests without the `stream` parameter now return a standard non-streaming `chat.completion` JSON object rather than unexpected SSE stream chunks, preventing downstream JSON parse failures.

#### Proxy Security & Leak Prevention

- **fix(security): enforce Strict Proxy on `/v1/chat/completions` to prevent IP leakage (#4007)**
  - When `strictProxy: true` is configured, requests will fail immediately if the proxy is unreachable or if no proxy URL is resolved, completely preventing silent fallbacks to the machine's direct public IP.

#### Dependency Stability Upgrades

- **chore(deps): bump dependencies for runtime stability and security**
  - Updated `@xyflow/react` to `^12.11.6`, `jose` to `^6.2.12`, `undici` to `^7.29.1` (connection leak & proxy fixes), `marked` to `^18.0.13`, `material-symbols` to `^0.47.4`, `monaco-editor` to `^0.56.0`, `open` to `^11.0.4`, `uuid` to `^13.0.2`, `postcss` to `^8.5.28`, and `better-sqlite3` to `^12.11.1`.
  - Updated `cli/package.json` with `esbuild` `^0.28.2` and aligned React versions to `19.2.4`.
  - Preserved major API stability bounds (`next` on 16.3.5 line, `chalk` 5, `http-proxy-middleware` 3, `socks-proxy-agent` 8) to prevent runtime breaking changes.

#### OAuth Token Refresh
- **fix(oauth): support numeric epoch timestamps in proactive token refresh (#4000)**
  - When `expiresAt` is stored or imported as a numeric string (epoch ms or seconds), `parseTimeMs` normalizes it safely across `tokenRefresh.js`, `chatCore.js`, and executor providers instead of producing `Invalid Date` / `NaN`, preventing silent refresh failures.

#### Antigravity Fake 429 & Account Strike Prevention
- **fix(antigravity): strip Claude Code billing header from system prompts (#4138, #4139)**
  - Claude Code prepends `x-anthropic-billing-header: ...` to system prompts. When passed through OpenAI-format translation to Antigravity, Google answers with fake `429 RESOURCE_EXHAUSTED`, triggering strike blocks on healthy accounts.
  - Added regex stripper to `ANTIGRAVITY_PROMPT_REWRITES` in `open-sse/config/appConstants.js`.

#### OpenCode Free Tier 403 FreeTierError Prevention
- **fix(opencode): inject cloaked decoy tools on all free tier requests with or without tools (#4101, #4146, #4165)**
  - OpenCode's free tier console validates agentic presence by checking for lowercase `bash` and `read` tools; requests from external coding agents (Claude Code, Cline) with N tools or PascalCase tools were rejected with `403 FreeTierError`.
  - Injects `bash` and `read` decoy tools unconditionally while preserving caller tools and defaulting missing `tool_choice` safely.
- **fix(opencode): clamp `xhigh`/`max`/`ultra` reasoning effort to `high` for muse-spark (#4149)**
  - OpenCode's Responses console rejects `xhigh` with HTTP 500 and `max`/`ultra` with 400. Automatically clamps unsupported high-tier efforts to `high` for muse-spark models.

#### Gemini & Antigravity Tool Schema Sanitization
- **fix(translator): sanitize unsupported schema constraints and normalize empty object properties (#4169, #4170)**
  - Strips `encrypted`, `cache_control`, `strict`, `$id`, and `example` from tool schemas before sending to Google Gemini / Antigravity, preventing 400 `INVALID_ARGUMENT` during agent tool calling.
  - Hardens object schema placeholder checks against non-object or array `properties`.

#### Cloudflare Workers AI Array Content & Schema Fix
- **fix(cloudflare-ai): normalize array message content, enforce string content, and alias `@cf` prefix (#1926, #4180)**
  - Cloudflare Workers AI models (such as `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b`) reject array message content with HTTP 400 `Type mismatch of '/messages/N/content', 'array' not in 'string'` and `required properties at '/messages/N' are 'role,content'`.
  - Added `@cf` to aliases in `cloudflare-ai.js` so `@cf/...` model references trigger `flattenContent`.
  - Normalizes array content blocks (including raw strings and `input_text`), ensures `content` is never null or undefined, and rewrites `role: "tool"` to `"user"`.

#### Tool Policy & Role Preservation
- **fix(translator): normalize top-level `anyOf`/`oneOf`/`allOf` in Claude tool `input_schema` (#4075)**
  - Anthropic strictly requires `input_schema.type === "object"`. Automatically merges top-level union schemas into valid object properties and enforces `type: "object"` to prevent HTTP 400 rejection from MCP and external tools.
- **feat(claude): pass through `safeguards` and `safeguard_results` for Claude Code auto-mode (#4173)**
  - Claude Code v2.1.278+ relies on server-side classifier checks to provide free auto-mode execution. Loloskan top-level `safeguards` across request translation and preserve `safeguard_results` on streaming delta responses.
- **fix(translator): preserve tool_choice "none", parallel_tool_calls, tool strict, and developer role (#4171, #4172)**
  - `tool_choice: "none"` now translates correctly to Claude `{ type: "none" }` and vice versa instead of widening to `"auto"`.
  - Maps `parallel_tool_calls: false` to Claude `tool_choice.disable_parallel_tool_use: true` and vice versa.
  - Preserves `strict: true` property on tool definitions when translating OpenAI tools to Claude format.
  - Preserves `role: "developer"` when target provider is OpenAI, only normalizing to `"system"` for providers that reject it.

#### Custom Provider Live Model Discovery in Combos
- **fix(combos): display live-discovered models from local and custom providers in Combo selector (#4177)**
  - Newly configured custom providers (such as Ollama, vLLM, or LM Studio) had live models fetched by the dashboard, but the Combo model selector only inspected manual aliases and registered custom models, omitting live models.
  - Merged `liveModelsByProvider` into custom provider model groups and supported aliases keyed by either `nodePrefix` or raw `providerId`.

#### Upstream Stability & Routing Cherry-Picks
- **fix(auth): don't cool down an account for request-scoped 4xx client errors (upstream #20a43f5)**
  - Client-side payload errors (400, 405, 413, 415, 422) without rate-limit or quota wording no longer trigger transient account cooldowns or lockout cascades, keeping healthy accounts available.
- **fix(antigravity): sanitize Hermes agent identity in system prompts (upstream #f642295)**
  - Rewrites Nous Research Hermes branding in system instructions to avoid triggering Google Cloud Code 429 quota locks.
- **fix(codex): route bare `codex-auto-review` model to Codex provider (upstream #efc80ba, #4135)**
  - Registers `codex-auto-review` in Codex registry and model prefix inference so Codex CLI's auto-review model routes to OAuth Codex instead of falling through to `openai` (which failed with 404).
- **fix(commandcode): retry on transient stream errors and avoid fake stop chunks (upstream #092c84e)**
  - Retries transient 502/503/504 stream responses on CommandCode upstreams and throws real stream errors instead of emitting fake completion stop chunks.

#### Token Saver Modules Synchronization & Upgrades
- **feat(headroom): add Gemini and Antigravity request envelope compression adapter (#4070)**
  - Projects plain text and `functionResponse` execution outputs from `request.contents[].parts[]` into temporary messages for Headroom `/v1/compress` and writes back compressed text in-place, eliminating "unsupported antigravity request shape" skips.
  - Normalizes reported tokens from alternative `/v1/compress` endpoints (e.g. lean-ctx `#4120`) supporting `original_tokens` and nested stats formats.
- **feat(caveman): synchronize rules with official Caveman v2.7.0**
  - Incorporates ASD-STE100 Simplified Technical English standards (one idea per sentence, max 20 words, active voice, present tense, imperative directives).
  - Explicitly forbids dropping essential negations (`not/never/no/only/except`), fake broken grammar insertion, invented abbreviations (`cfg/impl/req/res/fn`), and causal arrow characters (`→`), while firing tool calls directly with zero preamble.
- **feat(ponytail): synchronize rules with official Ponytail v4.10.0**
  - Incorporates the complete 7-rung ladder including codebase pattern reuse as Rung 2 to prevent common helper re-implementation.
  - Adds the root-cause bug fix directive (fixing shared callers once rather than patching symptoms) and mandates comprehensive code reading before picking a ladder rung.
- **feat(rtk): import official TOML output filters (`df`, `du`, `jq`, `ollama`, `gcc`)**
  - Synchronized from upstream `rtk-ai/rtk` to compact CLI outputs and reduce input token consumption across more development tools.





#### Claude Code Auto-Compaction & 1M Context
- **feat(claude-code): drive auto-compact window via `CLAUDE_CODE_AUTO_COMPACT_WINDOW` and add 1M-context toggle**
  - Replaces obsolete `CLAUDE_CODE_MAX_CONTEXT_TOKENS` with `CLAUDE_CODE_AUTO_COMPACT_WINDOW` so Claude Code triggers compaction at the intended threshold instead of ignoring the setting for recognized models.
  - Adds a "1M context" toggle that attaches `[1m]` marker to default models, preventing Claude Code from assuming a 200K window cap during long conversations.



## [0.7.1] - 2026-09-18

### Added / Fixed

#### Antigravity 403 PERMISSION_DENIED Root-Cause Fix
- **fix(antigravity): stop sending `x-goog-user-project` on chat requests**
  - Every Antigravity account was failing with `403 Caller does not have required permission to use project aicode-consumers`, while token refresh, `loadCodeAssist` (200, free-tier), and `onboardUser` (done) all succeeded — the same signature as upstream reports `decolua/9router#1059`, `#2461`, `#2932`.
  - Live A/B against `daily-cloudcode-pa` proved the header is the trigger: the identical envelope 403s with `x-goog-user-project: aicode-consumers` and passes the project gate without it (then resolves by model name). Google treats the header as "bill/attribute to this project" and enforces `serviceusage.services.use`, which the shared free-tier project denies to third-party OAuth callers. The project still travels in the body envelope's `project` field.
  - Verified end-to-end on a live AI Pro connection: `gemini-3.8-flash-high` returns HTTP 200 without the header. Same approach as `opencode-antigravity-auth`, which strips this header to prevent 403 auth/license conflicts.
  - Note: the `(tier)` suffix in registry `upstreamModelId` values (e.g. `gemini-3.8-flash-high(high)`) never reaches the wire — `chatCore.js` strips it via `stripThinkingSuffix` and conveys the tier as `thinkingLevel`, matching the exact model IDs returned by live `fetchAvailableModels`. No registry change needed.

## [0.7.0] - 2026-09-17

### Added / Fixed

#### Dependency Security Patches
- **chore(deps): patch 4 advisories reported against the dependency tree (0 remaining)**
  - `next` `^16.1.6` → `^16.3.5` (with `@next/third-parties` and `eslint-config-next` pinned to the same line), clearing both critical Next.js advisories (GHSA-p293-qw3h-jr36, GHSA-2xp9-vwfh-vxw4).
  - Transitive high-severity fixes applied through `overrides`: `sharp` `^0.35.4` and `js-yaml` `^4.3.2` (staying on the 4.x line so no consumer breaks on the 5.x API change).
  - Verified: `npm audit` reports 0 vulnerabilities at every severity; `gitbook/` and `tests/` workspaces already audit clean.
- **chore(ci): refresh pinned GitHub Actions to current majors**
  - `actions/checkout@v7`, `actions/setup-node@v7`, `softprops/action-gh-release@v3`, `docker/setup-buildx-action@v4`, `docker/login-action@v4`, `docker/metadata-action@v6`, `docker/build-push-action@v7`, `peter-evans/dockerhub-description@v5`.
  - The release job now publishes the curated `RELEASE_NOTES_v0.7.0.md` as the release body instead of auto-generating notes from commit subjects.

#### Gemini & Antigravity Resilience
- **fix(translator): harden Gemini thought signatures against truncation and stop cascading account locks on 400**
  - Added `isValidBase64` validation for thought signatures before forwarding to Google Cloud Code / Antigravity.
  - Implemented in-memory signature recovery cache (`signatureCache`) to handle client-side `tool_call_id` truncation (e.g. 60/64 character limits in SDKs/agents).
  - Safe fallback to `DEFAULT_THINKING_AG_SIGNATURE` on truncated or invalid signatures, preventing Google API 400 Base64 decoding errors.
  - Prevented unhandled client payload errors (400, 422) from triggering account fallback and locking out healthy accounts across the pool.
- **fix(gemini): expand shorthand string subschemas and isolate schema maps in tool declarations (#3999)**
  - Expanded shorthand string subschemas (e.g. `{ value: 'object' }`) into proper Schema objects with required placeholders.
  - Protected schema maps (`properties`, `patternProperties`, `$defs`, `definitions`) from recursive mutation when tools declare properties named `properties` or `items`.
- **fix(translator): preserve all system messages in OpenAI -> Gemini request translation (#3972)**
  - Collected multiple system messages as parts under `systemInstruction` instead of silently overwriting with the last one.
- **fix(antigravity): ensure maxOutputTokens > thinkingBudget and inject thinkingConfig (#3979)**
  - Ensured `maxOutputTokens` strictly exceeds `thinkingBudget` and injected `thinkingConfig` into `generationConfig` to prevent Google Cloud Code 400 `INVALID_ARGUMENT`.
- **fix(antigravity): omit requestType=agent, strip telemetry, and normalize harness tags (#3986, #3987)**
  - Omitted `requestType: 'agent'` to prevent Google Cloud Code from triggering separate agent quota bucket and false 429 RESOURCE_EXHAUSTED.
  - Normalized competing harness tags (`<system-conventions>`, `<critical>`, Oh My Pi) in system instructions.
  - Stripped `used_claude` telemetry flags before forwarding upstream.
  - Injected `x-goog-user-project` in headers when projectId is present.
- **fix(translator): support IMAGE and DOCUMENT blocks for Antigravity Claude envelope (#3968)**
  - Converted `CLAUDE_BLOCK.DOCUMENT` to `OPENAI_BLOCK.FILE` in `claudeToOpenAIRequest`.
  - Forwarded `CLAUDE_BLOCK.IMAGE` and `DOCUMENT` as `inlineData` in `wrapInCloudCodeEnvelopeForClaude` to unblock vision and PDF reading on Antigravity Claude models.

#### Proxy & Security Hardening
- **fix(proxy): forward strictProxy flag to prevent direct bypass on chat routes (#4007)**
  - Propagated `strictProxy` through `auth.js`, `chatCore.js`, `chat.js`, `tokenRefresh.js`, and `quotaAutoPing.js` so proxy pools configured with `strictProxy: true` fail closed instead of leaking the operator's real IP to upstreams.
- **fix(providers): surface underlying DNS, timeout, and OAuth error details during test connection (#4015)**
  - Surfaced descriptive error message and OAuth error detail on connection test failure instead of masking with static generic labels.
- **fix(mitm): guarantee hosts cleanup on shutdown/crash and guard tool DNS restore (#4014)**
  - Cleaned all MITM tool hosts from system hosts file on CLI shutdown, process exit, and PID file cleanup.
  - Added hosts file cleanup on uncaughtException, exit, and EADDRINUSE in `mitm/server.js`.
  - Guarded `restoreToolDNS` to verify MITM server is running before attempting restoration, preventing `127.0.0.1:443` connection refused errors in official IDE extensions.

#### Video & Multi-Model Account Isolation
- **fix(video): scope video polling failure lock to __video__ and ignore 404 (#4009)**
  - Scoped `handleVideoGet` failure locks to `__video__` instead of `null` (preventing account-wide `modelLock___all` that takes down chat models like Grok).
  - Ignored 404 client errors on dead or expired video request IDs.

#### Token Refresh & OAuth Lifecycle
- **fix(oauth): parse numeric epoch expiresAt so imported connections still refresh (#4000)**
  - Accepted numeric epoch strings in `parseTimeMs` and normalized them in `normalizeExpiresAt`, preventing imported connections from silently skipping proactive and background token refresh sweeps.

#### Stream Handling & Usage Analytics
- **fix(stream): stop blocking Ollama upstream's NDJSON as a non-SSE body (#3985)**
  - Allowed `application/x-ndjson` for Ollama-format upstreams in `handleStreamingResponse` while continuing to block HTML/text error pages.
- **fix(stream): recognize delta.reasoning in SSE-to-JSON aggregation to prevent non-streaming 500 (#3796)**
  - Accumulated `delta.reasoning` alongside `delta.reasoning_content` in `parseSSEToOpenAIResponse` and `nonStreamingHandler.js`, preventing reasoning-heavy models (e.g. GLM, DeepSeek) from triggering false 500 empty response errors in non-streaming mode.
- **fix(claude): surface prompt-cache reads to chat/completions clients and stop double-counting in usage logs (#3984)**
  - Recorded `state.usage` in canonical OpenAI format (`prompt_tokens` + `cached_tokens` + `prompt_tokens_details`).
  - Fixed `canonicalizeUsage` double-counting cached tokens in usage logs.
- **fix(commandcode): record prompt-cache reads and reasoning tokens in usage extractor (#4025)**
  - Passed `cachedTokens` and `reasoningTokens` through as details in CommandCode `USAGE_EXTRACTORS` without double-counting `inputTokens`.
  - Enables prompt-cache pricing rates for CommandCode models instead of billing cache reads at full input cost.

#### Tool Schema Compatibility
- **fix(codex): strip Unicode-property tool schema patterns Codex rejects (#3922)**
  - Added copy-on-write `stripCodexUnsupportedPatterns` to strip `\p{...}` patterns that Codex's regex validator rejects with 400.
- **fix(kiro): never send top-level systemPrompt to prevent 400 REQUEST_BODY_INVALID (#3641)**
  - Appended repair instructions and RTK system prompts to user turn content instead of writing top-level `systemPrompt`.

#### Model Capabilities & Custom Models
- **fix(deepseek): register canonical deepseek-flash id, vision capabilities, and scope capacity adapter pools (#3994, #3995)**
  - Added `deepseek-flash` and updated `deepseek-v4-flash` in `MODEL_CAPABILITIES` with 1M context, 384k output, vision + reasoning.
  - Registered `deepseek-flash` in `deepseek.js` registry and pointed legacy IDs to upstreamModelId `deepseek-flash`.
  - Scoped `getCapacityAdapterModels` by `requiredCapabilities` to prevent unrelated pools (e.g. empty audio pool) from injecting models into vision requests.
- **fix(capabilities): honour operator-declared caps on custom models (#3974)**
  - Layered operator-declared capabilities (`caps`) over inferred capabilities in `/v1/models` and `chatCore.js` modality stripping.
  - Prevents hand-declared vision-capable custom models from having images stripped before upstream dispatch.

#### Dashboard & UI Integrity
- **fix(oauth): automatically use the public dashboard domain for compatible provider callbacks (#4054)**
  - Authorization-code providers that accept web callbacks (`claude`, `cline`, `clinepass`, `gitlab`, `iflow`, `kimchi`) now return to `${window.location.origin}/callback` when the dashboard is opened through an HTTPS tunnel, reverse proxy, custom domain, or subdomain. The popup then completes through same-origin `postMessage`/BroadcastChannel without manual URL rewriting.
  - Installed-app providers keep their required loopback callbacks (`antigravity`/`gemini-cli` and similar); Codex and xAI keep their fixed ports. These providers retain the manual-paste/proxy fallback because replacing a registered loopback callback with an arbitrary domain would cause upstream `redirect_uri_mismatch`.
  - Added a server-side same-origin/loopback redirect guard for both authorize and exchange endpoints. Hardened callback `postMessage` validation with strict URL/hostname checks plus popup source validation (no substring trust such as `localhost.attacker.example`).
  - Test: `tests/unit/oauth-public-callback.test.js` (12/12: public domains/subdomains/ports, fixed loopback providers, installed-app fallback, strict message origins, server redirect validation).
- **fix(auth): hide the default-password hint once a custom password is set**
  - `/api/auth/status` now reports `usesDefaultPassword` (no stored hash AND no real `INITIAL_PASSWORD` env — shared helper in `dashboardSession.js`). The login page renders the `12345678` hint only when that flag is true, so rotated passwords no longer advertise the default; fetch failures default to hidden (fail-closed).
  - Test: `tests/unit/auth-status.test.js` extended (route flag matrix + real-helper env matrix).
- **fix(dashboard): reset credential modals on close so reopened forms start clean (#4026)**
  - Reset form states and validation results on close in `AddApiKeyModal`, `AddCompatibleModal`, `ConnectionsCard`, `CursorAuthModal`, and `KiroAuthModal`.
  - Fixed Kiro CLI proxy modal not closing on import completion (`import-cli-proxy`).

#### Auth, Providers & Usage Fixes
- **fix(security): honor REQUIRE_API_KEY env on all /v1 enforcement points (#2834)**
  - The variable was documented in README/`.env.example` as enforcing Bearer keys on `/v1/*` for internet-exposed deploys, but no runtime code read it — operators got neither enforcement nor warning on services holding provider OAuth tokens.
  - New `isApiKeyRequired(settings)` helper (`settingsRepo.js`, re-exported via DB barrel + `localDb` shim): dashboard setting OR env `=== "true"`. One-way by design — the env var can only turn enforcement ON, never off. Wired into all 9 enforcement points (chat, fetch, search, embeddings, tts, stt, video, image, v1beta models route) plus a clarifying `.env.example` comment.
  - Test: `tests/unit/require-api-key-env.test.js` (5/5: setting×env matrix, exact-`"true"` matching, barrel exports).
- **fix(observability): record in-stream upstream failures instead of success (#4104)**
  - An upstream can end an HTTP-200 stream with a failure inside the event body (Responses `response.failed` / `error` event). Completion logging never inspected the terminal event, so `requestDetails`/dashboard showed `success` with billed-looking usage for failed requests.
  - `stream.js` now tracks failed terminal events in passthrough and translated Responses streams and passes `{ failed, error }` through `onStreamComplete`; `buildOnStreamComplete` writes `status: "failed"` with the upstream message in `response.error` (abort path and clean-success path unchanged).
  - Test: `tests/unit/stream-failure-status.test.js` (5/5: passthrough failed/completed meta, translated Responses.failed, failed vs success record shape).
  - Audit notes (no action needed): tunnel/operational-endpoint auth is covered by `dashboardGuard` LOCAL_ONLY + dual-auth gates; default-password remote gate is enforced at login; request payloads are hard-redacted so the #2472-class log-bloat OOM cannot occur; pending-request counters self-clean with timeout reset.
- **fix(auth): set 24h maxAge on dashboard session cookie**
  - `setDashboardAuthCookie` now sets `maxAge` via `SESSION_MAX_AGE_SEC` (86400s), matching the JWT `exp` (`createDashboardAuthToken` already used 24h). Previously the cookie was session-scoped while the token expired, causing silent auth drops on browser restore.
- **fix(providers): clear stale locks after validation (#3830)**
  - `resetHealthStateOnActivation` in `connectionsRepo.js` clears `modelLock_*`, `backoffLevel`, `rateLimitedUntil`, and `errorCode` whenever a connection is marked `active` after successful validation or OAuth re-login, so recovered accounts stop being routed around forever.
- **fix(usage): parse Fable weekly limit from limits[] instead of fabricating a row (#3847)**
  - `getClaudeUsage` reads `weekly_scoped` entries in `data.limits[]` (`scope.model.display_name` + `percent`) for model-scoped windows like Fable. No limits entry means no row — never fabricates a 100% quota row.
- **fix(tools): scope Claude tool type defaulting to gateways that need it (#3905)**
  - `type: "custom"` default now runs only when the provider declares the `requireClaudeToolType` quirk (MiniMax, MiniMax-CN). DeepSeek's Anthropic-compatible endpoint rejects `custom` with 400, which previously surfaced as a persistent 503 on every Claude-format request routed there — now restored to the legacy typeless shape.
  - Test: `tests/translator/bugs-3905-deepseek-tool-type.test.js` (3/3 passed).
- **fix(claude): cap re-anchored cache_control at the 4-marker budget and keep single-object content turns**
  - `anchorClaudeCache` normalizes bare-object content, strips `cache_control` from `defer_loading` tools first, pins the 1h head anchors (last system block + last cacheable tool), then trims over-budget bodies to 4 markers. Previously a spent budget produced a 5th marker that 400s non-retryably and the failure path retried the same malformed body across the pool until every account locked.
  - `convertClaudeMessage` (claude-to-openai) normalizes single-block-object content before the role branch so bare-object system turns are no longer dropped.
  - `hasValidContent` keeps single-object content turns.
- **chore(baseline): sync providers snapshot to centralized Claude fingerprint 2.1.258**
  - `providers-baseline.json` still expected `claude-cli/2.1.257` while `open-sse/config/clientVersions.js` already shipped 2.1.258 — one-line sync, `verify-providers.mjs` green again (81 providers). Alias and OAuth baselines verified unchanged.

#### Client Fingerprint Refresh (all versions re-verified 2026-09-17 against first-party sources)
- **chore(versions): bump all client fingerprints to current stable**
  - `open-sse/config/clientVersions.js` (single source — registry UA, image `Version` header, connection-test headers, and billing header all derive from it; audit found no hardcoded versions left in `open-sse/`/`src/`/`cli/`):
  - Claude Code 2.1.258 → **2.1.274** (anthropics/claude-code GitHub release, published Sep 17; stays inside the allowed-range gate — outdated clients get hard 400s on new models).
  - Codex CLI 0.149.1 → **0.154.0** (npm `latest`).
  - Gemini CLI 0.56.0 → **0.60.0** (npm `latest`; core still pins `@google/genai@1.30.0` exact at v0.60.0, so the `apiClient` pair is unchanged).
  - Kiro IDE 1.0.337 → **1.0.437**, CLI 2.19.1 → **2.21.0** (kiro.dev/changelog, Sep 1).
  - Antigravity IDE 2.11.0 → **2.12.2** (antigravity.google/changelog, Sep 3; CLI line now 1.1.25).
  - VSCode 1.134.0 → **1.137.0**, copilot-chat 0.63.0 → **0.65.0** (pair verified from `extensions/copilot/package.json` at vscode tag `1.137.0`, released Sep 9).
  - Trae 3.5.87 → **3.5.91** (trae docs, Aug 19 hotfix range 3.5.89–3.5.91).
  - CodeBuddy 2.138.0 → **2.151.0** (npm `@tencent-ai/codebuddy-code` latest).
  - Grok Build 1.0.5 → **1.0.34** (`https://x.ai/cli/stable` channel pointer; pager/shell UA assumed to track the CLI release train — re-capture HAR if Grok 400s appear).
  - Kimchi 1.0.3 → **1.1.23** (getkimchi/kimchi GitHub latest, Sep 16; note upstream added a real model-deprecation protocol in 1.1.x — watch for server-side model retirements).
  - Zed 1.16.2 → **1.18.1** (stable channel, Sep 4).
  - Fingerprint policy: every spoofed version is a real, currently-supported public release (never fabricate future versions); one constant per client so registry, image, test, and billing headers cannot drift apart.
  - Tests/baselines: `claude-cloaking` + `claude-header-forwarding` expectations bumped; `golden-url-header` snapshots regenerated (version-strings only: claude/codebuddy/grok/kimchi); `providers-baseline.json` synced (codex/gemini/claude/antigravity/copilot/kiro/codebuddy/kimchi/grok UAs); alias + OAuth baselines green.

#### Antigravity Location-Gate Hardening
- **fix(antigravity): stable fallback project id per connection (stop random id per request)**
  - `transformRequest` fell back to `this.generateProjectId()` — a NEW random id on every request — whenever a connection had no stored `projectId`. Google evaluates quota/eligibility per project, so a rotating id looks abusive and breaks project-scoped checks.
  - Now via `resolveAntigravityProjectId`: a provisioned `projectId` always wins; the fallback is ONE stable id per connection identity (bounded in-memory cache, `MAX_STABLE_PROJECTS = 500`).
  - Test: `tests/unit/antigravity-project-stability.test.js` (7/7).
- **fix(error): actionable hint for Google "User location is not supported"**
  - This 400 `FAILED_PRECONDITION` is decided by Google from the server's egress IP region (the Antigravity free tier enforces its own regional allowlist) — retrying or reshaping the payload cannot help. `withLocationGateHint` (`open-sse/utils/error.js`, applied on both `parseUpstreamError` paths) appends remediation steps to the error message delivered to clients.
  - The hint avoids `ERROR_RULES` trigger phrases, so the fail-fast classification holds: no fallback, no cooldown, accounts stay safe. Test: `tests/unit/error-location-hint.test.js` (7/7, including classification guard).
- **docs: `docs/antigravity-location-error.md`** — root cause, evidence (official clients affected; Germany/Slovakia/Vietnam/Indonesia reporters; Gemini-only outage), isolation ladder (run the official CLI on the same machine), workarounds (per-connection proxy egress in SG/US, Claude models, disable TUN/IPv6), and what cannot be fixed client-side.

#### New-Model Fixes
- **fix(thinking): never emit `reasoning_effort:"none"` to upstreams that reject it (#4031, gpt-6-astra)**
  - Root cause: a provider-level thinking default (or an explicit client `"none"`) was written verbatim to the OpenAI wire, but the Astra upstream only accepts low/medium/high — so every tools request failed with 400.
  - `*gpt-6-astra*` now declares `thinkingCanDisable:false` (same pattern as Fable 5.1); the `openai` branch of `thinkingUnified.js` omits the field when `none` meets a model that cannot disable (upstream default applies) — same precedent as the `tokenrouter` branch. Models that can disable (e.g. gpt-5) still receive explicit `"none"`, unchanged.
  - Test: `tests/translator/bugs-4031-astra-reasoning-effort.test.js` (6/6: omit on none/suffix/injected, low-medium-high passthrough, canDisable guard).
  - Note: native `/v1/responses` proxying (#4031 §3) is a separate architectural feature and out of scope — with this fix the chat/completions path goes out clean, without any value the upstream rejects.
- **feat(cline): expose `cline-free/muse-spark-1.3-contributor` (#3946)**
  - The Cline Free catalog model was missing from the `cline` provider list, so it could not be selected or connection-tested — added to `registry/cline.js` with an exact caps entry (vision + reasoning, OpenAI format, 1M context / 131k output, same profile as the OpenCode Free variant).
  - Test: `tests/unit/cline-muse-spark-13.test.js` (3/3: registry listing, caps resolution, profile parity).
  - Note: the 401 "use latest version of Cline" half of the issue is an upstream entitlement gate that cannot be verified without live credentials — the ZenRouter UA is deliberately not spoofed as Cline (fabricated client versions risk account flags, against fingerprint policy).
- **fix(opencode): compliant Zen identity headers for free-tier models (#4101)**
  - The backend gates free-tier calls on client identity: bare `User-Agent: opencode` and non-canonical `x-opencode-session` values fail with 403 FreeTierError. `OPENCODE_UA` is now `opencode/1.18.31` (real release, above the 1.17.0 minimum); sessions are minted as `ses_` + 12 hex timestamp digits + 14 Base62 chars, with real client sessions passed through byte-identical and derived ids mapped once to a stable canonical value (no per-request churn against per-session quota accounting).
  - `x-opencode-request` is deterministic per turn (session + last user message hash, same `msg_` shape) instead of random per request.
  - Test: `tests/unit/opencode-zen-identity.test.js` (7/7: format, passthrough, per-identity stability, downstream preservation).
- **fix(antigravity): keep inlineData on image-model requests; forward all input images (#4112)**
  - The image branch rebuilt contents text-only, silently degrading edits to text-to-image; the image handler forwarded only `images[0]`. Now `inlineData`/`inline_data` parts are preserved (normalized to camelCase) and every entry of `images[]` is forwarded. `gemini-3.1-flash-image` advertises `edit` + `multiImage`.
  - Test: 2 new cases in `tests/translator/bugs-antigravity.test.js` (camelCase + snake_case).
- **fix(kiro): preserve underscores in tool names and restore originals on response (#4113)**
  - `uniqueName` no longer collapses `__` (so `mcp__server__tool` reaches Kiro intact); request translators attach a `_toolNameMap` reverse map when sanitizing/deduping, and response translators restore the client-original name (streaming via state, non-streaming via payload map, plus the existing decloak layer).
  - Test: `tests/translator/kiro-tool-name-roundtrip.test.js` (6/6).
- **fix(kiro): neutral placeholder for tool-result-only turns (#4108)**
  - Empty user turns carrying only tool results were filled with literal `"continue"`, which models answer as a new instruction and drop the in-progress task. Now `kiroEmptyUserContent()` emits `"Tool results provided."` when tool results are present (genuinely empty turns keep `"continue"`, which Kiro requires over empty content).
  - Test: `tests/unit/kiro-tool-result-placeholder.test.js` (5/5); golden `OpenAI → Kiro` snapshot refreshed (1-line placeholder diff).
- **fix(responses): repair missing `call_id` instead of exhausting every strict upstream (#4091)**
  - Responses `function_call_output` / `custom_tool_call_output` items without `call_id` previously serialized as `role:"tool"` without `tool_call_id`; strict providers rejected the entire request with 400 and a combo could fail every member. Both Responses converters now queue pending calls and pair missing outputs in order; calls missing their own id receive deterministic ids; true orphan outputs are dropped; chat-style orphan tool items are downgraded to user context.
  - `ensureToolCallIds` now also repairs an absent tool-message id by pairing the oldest unanswered assistant call (or minting a deterministic fallback).
  - Test: `tests/unit/openai-responses-missing-tool-call-id.test.js` (8/8: missing/both-missing ids, parallel order, true orphan, custom tools, duplicate converter, chat repair/downgrade).
- Verified: focused OAuth/model/translator tests 53/53 passed; full vitest suite 2509 passed / 0 failed, eslint clean on all touched files.

## [0.6.1] - 2026-09-07

### Added / Fixed

#### Security & Stability Hotfixes
- **fix(security): allow cdn.jsdelivr.net in CSP for Monaco Editor on translator page**
  - Added `https://cdn.jsdelivr.net` to `script-src`, `style-src`, `font-src`, and `connect-src` in `next.config.mjs` Content Security Policy, resolving Monaco Editor load blockage and unhandled runtime exceptions on `/dashboard/translator`.
- **fix(ui): defensive string handling in model & combo search filter**
  - Safely handle models and combos with undefined or missing `name` in `ModelSelectModal.js`, preventing `TypeError: can't access property "toLowerCase", t.name is undefined` and `localeCompare` crashes during search and sorting.

#### 9Router critical backports (#3782, #3784, #3764, #3786, #3833)
- **fix(security,translator,dashboard): backport 5 critical 9router fixes**
  - SSRF guard on `POST /api/cli-tools/cowork-mcp-tools` for remote callers (`assertPublicUrl`, local-host self-hosted MCP keeps working).
  - `injectReasoningContent` passes non-array `messages` through for upstream 400 instead of unhandled 500.
  - `ensureToolCallIds` / `generateToolCallId` skip null entries and coerce non-string tool names.
  - `claude-adaptive` maps `auto` effort to `high` instead of writing literal `auto` into `output_config` (400 + account backoff).
  - Concurrent per-model Test buttons via `testingModelIds` Set on `ModelsCard` + `CompatibleModelsSection`.
  - Tests: `tests/unit/cowork-mcp-ssrf-guard.test.js`, `tests/unit/translator-toolcall-null-guards.test.js`, expanded `thinking-unified` + `reasoningContentInjector` suites. Full suite 2352 passed, build clean.

#### GPT-6 Astra official mapping
- **feat(models): add GPT-6 Astra official mapping**
  - `*gpt-6-astra*` / `*gpt-6*` capability pattern: 1050000 ctx, 128000 out, vision+reasoning+search, openai thinking format.
  - Pricing exact + patterns at official 10/50 rates (cached 1, cache_creation 12.5).
  - Test: official limits asserted across codex/openai/luo aliases in `tests/unit/capabilities.test.js`.

#### ESLint zero-errors across the repo
- **fix(lint): zero eslint errors/warnings in shared components, dashboards, and data modules**
  - Async dashboard loaders converted to cancelled-IIFE effects with unmount guards (fixes `set-state-in-effect` cascading-render risk in ~40 components).
  - React-compiler violations fixed: used-before-declared loaders moved up, impure calls memoized, ref reads moved out of render.
  - `<img>` migrated to `next/image`, entities escaped, `exhaustive-deps` completed.
  - `import/no-anonymous-default-export` scoped off for `open-sse/**` + `src/lib/**` (single-descriptor modules by design); cli build output ignored; 3 stale disables removed.
  - Verified: `npx eslint` 0 errors, 2352 tests passed, `npm run build` clean.

#### Database fail-closed on corruption (#3817)
- **fix(db): fail closed before migrating corrupted databases**
  - `PRAGMA quick_check` integrity gate in `runMigrationOnce`; `DatabaseCorruptionError` stops boot before schema mutation or backup pruning, driver chain never falls through.
  - Recovery stays manual with backup candidates under `${DATA_DIR}/db/backups`.
  - Tests: `tests/unit/db-integrity-safety.test.js` 2/2 passed. Docs: integrity gate in `docs/ARCHITECTURE.md`.

#### Combo visibility + cache budget lock
- **fix(dashboard): show combos on every media kind page, lock cache budget**
  - `COMBO_KINDS` enabled for embedding/image/imageToText/tts/stt/video/music so kind-tagged combos stop vanishing (fixes #3787).
  - Test: `anchorClaudeCache` re-anchor counted at max 3 markers, never exceeding the Anthropic 4-marker budget (#3795 verified already-safe).

## [0.6.0] - 2026-09-03

### Added / Fixed

#### Security / Dependabot Vulnerabilities Resolution (51 Vulnerabilities Resolved)
- **fix(security): resolve 51 Dependabot alerts by updating gitbook Next.js and overriding transitive dompurify and qs**
  - Updated `next` to `^16.3.2` in `gitbook/package.json`, resolving 31 vulnerabilities (including all 13 High severity CVEs in older Next.js 16.1.1).
  - Added npm overrides in root `package.json` for `dompurify` (`^3.4.14`) and `qs` (`^6.16.0`), eliminating 18 `dompurify` XSS/bypass vulnerabilities and 2 `qs` DoS/array-limit bypass vulnerabilities.
  - Achieved `0 vulnerabilities` on both root and `gitbook` `npm audit` reports.

#### Dashboard UI/UX, Theme Flash & Indonesian Localization (#925cb4aad, #831001c32, #c24a85427, #a58902e4a)
- **feat(ui): pool theme pre-hydration script, connections scroll container, CLI key presets, and complete Indonesian localization**
  - Added pre-hydration inline script in `<head>` of `src/app/layout.js` to inspect `localStorage.getItem("theme")` and immediately apply `.dark` to `documentElement` before the browser performs first paint, eliminating reload white flash.
  - Constrained provider connection list height with `max-h-[500px] overflow-y-auto pr-1` in `src/app/(dashboard)/dashboard/providers/[id]/page.js` and `ConnectionsCard.js`, preventing unbounded vertical growth when managing dozens of provider accounts.
  - Extended CLI tool endpoint presets store in `cliEndpointPresets.js` to support saving, deleting, and naming custom API key presets across tools; updated `ApiKeySelect.js` to allow saving custom keys directly into named presets and restored keys from tool config.
  - Completed Indonesian localization (`public/i18n/literals/id.json`) to 1,450 translated literals while strictly sanitizing and enforcing ZenRouter branding (`ZenRouter`, `sk_zenrouter`, and clean CLI instructions).
  - Added unit test suite in `tests/unit/cli-endpoint-presets.test.js` covering endpoint and key preset stores.

#### Provider Catalog, Web Fetch & Missing Assets (#44e4b80bb, #e0ffc7e2a, #6efb97904)
- **feat(providers): pool Ollama Cloud web fetch, dead opencode model filter, and missing icons**
  - Added Ollama Cloud as a full `webFetch` provider in `open-sse/handlers/fetch/index.js` and `open-sse/providers/registry/ollama.js`, supporting markdown extraction, page titles, and discovered link harvesting via `https://ollama.com/api/web_fetch`.
  - Scoped web fetch provider failures using `webfetch:<providerId>` lock keys in `src/sse/handlers/fetch.js`, ensuring fetch quota or timeout errors never take account credentials offline for LLM chat requests.
  - Filtered unavailable `deepseek-v4-flash-free` from OpenCode suggested free models in `src/app/api/providers/suggested-models/filters.js` to avoid offering dead model choices to users.
  - Added pricing entry for `z-ai/glm-5.3-free` in `open-sse/providers/pricing.js`.
  - Added missing 128x128 provider icons in `public/providers/` for `alims-intl.png`, `alitp-intl.png`, `fish-audio.png`, and `selfhosted-*` services to eliminate 404 images on the dashboard.
  - Added unit test suites in `tests/unit/ollama-web-fetch-provider.test.js` and `tests/unit/suggested-models-filters.test.js`, and expanded tests in `tests/unit/fetch-success-clears-account.test.js`.

#### Claude & Routing Integrity / Foreign Server Tool Dropping, 1M Context Marker & Adaptive Thinking (#3685, #3690, #3692, #3718)
- **fix(routing): pool Claude foreign tool sanitizing, 1M context marker, and OpenAI-wire thinking (fixes #3685, #3690, #3692, #3718)**
  - Dropped foreign `server_tool_use` blocks with non-Anthropic IDs (e.g. `call_` from GLM/OpenAI) and their paired `tool_result` / `web_search_tool_result` blocks in `open-sse/translator/formats/claude.js`, preventing HTTP 400 session poisoning in multi-provider combos.
  - Stripped empty text blocks and pruned empty messages leftover after foreign tool filtering to adhere to Anthropic Messages API validation rules.
  - Updated `open-sse/translator/concerns/assistantPrefillPolicy.js` to recognize `server_tool_use` blocks so valid trailing server tool calls are not erroneously discarded as empty text prefills.
  - Added `open-sse/utils/modelMarkers.js` with `stripModelContextMarker` to strip the `[1m]` suffix Claude Code appends during 1M context beta before model routing in `src/sse/handlers/chat.js`.
  - Bumped `CLAUDE_CODE_VERSION` to `2.1.258` in `open-sse/config/clientVersions.js` to support the latest Claude Code capabilities and Fable 5.1 model fingerprinting.
  - Declared `claude-fable-5-1` in `open-sse/providers/capabilities.js` with `thinkingCanDisable: false` and adjusted `claude-adaptive` handling in `open-sse/translator/concerns/thinkingUnified.js` to pass `output_config.effort` directly without redundant `thinking` blocks.
  - Introduced `NATIVE_ONLY_FORMATS` in `open-sse/translator/concerns/thinkingUnified.js` to ensure models with native thinking formats (Gemini, Claude) always resolve to `openai` (`reasoning_effort`) when routed over OpenAI-compatible endpoints.
  - Added unit test suites in `tests/unit/claude-foreign-server-tool-use.test.js` and `tests/unit/model-context-marker.test.js`, and expanded tests in `tests/translator/thinking-unified.test.js`, `tests/unit/capabilities.test.js`, and `tests/unit/claude-cloaking.test.js`.

#### Gemini & Antigravity / Function Response Protobuf Struct Wrapping (#3318)
- **fix(translator): wrap JSON array tool responses into Struct object for Gemini (fixes #3318)**
  - Wrapped JSON array tool responses into `{ result: [...] }` in `open-sse/translator/request/openai-to-gemini.js` so `functionResponse.response` is always a `google.protobuf.Struct` object, eliminating `INVALID_ARGUMENT: Proto field is not repeating, cannot start list`.
  - Passed JSON object responses directly without redundant double-wrapping in `{ result: { ... } }`.
  - Preserved empty string tool responses as `{ result: "" }` instead of dropping them during boolean truthiness check.
  - Added unit test suite in `tests/unit/gemini-function-response-struct.test.js`.

#### Tool Calling & Function Limits / Tool Name Length Compression (#3622, PR #3637)
- **fix(translator): compress tool names > 64 chars to prevent Gemini/Vertex/OpenAI rejection (fixes #3622)**
  - Added `open-sse/utils/toolCompressor.js` with `compressToolNames`, compressing tool names longer than 64 characters to a 55-character prefix with an 8-character MD5 hash suffix to guarantee uniqueness without prefix collision.
  - Rewrote tool declarations, message history (`tool_use`, `tool_calls`, `tool` response), and `tool_choice` across Claude and OpenAI request payloads.
  - Added `decloakOpenAIChunk` to restore compressed tool names back to their original full client names on both streaming SSE deltas and non-streaming response completions.
  - Added unit test suite in `tests/unit/tool-name-compression-3622.test.js`.

#### Search & SSRF / SearXNG Docker Internal Routing (#3756)
- **fix(search): allow admin-configured internal SearXNG and Ollama search in Docker (fixes #3756)**
  - Differentiated admin-configured base URLs (`SEARXNG_URL` on Docker network `searxng:8080` or loopback) from untrusted client overrides in `open-sse/handlers/search/index.js`.
  - Bypassed private-IP blocking of `fetchPublic` only when no client-supplied `providerOptions.baseUrl` is present, allowing standard Docker sibling container deployments to function without 502 errors.
  - Retained strict `fetchPublic` SSRF validation on any client-provided baseUrl overrides.
  - Added unit test suite in `tests/unit/search-searxng-ssrf-3756.test.js`.

#### Models API / Single Model Lookup Route (#3588, upstream 5caa72f5f)
- **fix(models): replace single-segment route with catch-all for single model lookup (fixes #3588)**
  - Replaced `src/app/api/v1/models/[kind]` with catch-all `src/app/api/v1/models/[...model]/route.js` to correctly match provider-prefixed IDs containing slashes (e.g. `cc/claude-sonnet-5`, `openai/gpt-4o`).
  - Preserved capability filtering routes (`/v1/models/image`, `/v1/models/web`, etc.) while returning OpenAI-compatible model objects or `404 model_not_found` for individual model queries.
  - Added unit test suite in `tests/unit/v1-model-lookup-3588.test.js`.

#### Server Stability & CLI Crash Recovery (#3755, #3743)
- **fix(cli,server): safely disable MITM in SQLite and JSON on repeated crash (fixes #3755)**
  - Added `disableMitmInDatabase` in `cli/cli.js` supporting both SQLite `data.sqlite` (`node:sqlite` / `better-sqlite3`) and legacy `db.json`, preventing infinite restart crash loops when upgrading from 0.5.55.
  - Set `ZENROUTER_DISABLE_MITM=1` and honored it in `src/shared/services/initializeApp.js` during emergency recovery.
  - Always surfaced `crashLog` to console on maximum restarts to provide immediate diagnostic visibility.
  - Added unit test suite in `tests/unit/cli-restart-mitm-3755.test.js`.
- **fix(gemini): convert `prefixItems` and ensure array items in schema sanitizer (fixes #3743)**
  - Added `convertPrefixItems` to map tuple parameter definitions to `items` before keyword removal in `open-sse/translator/formats/gemini.js`.
  - Added `ensureArrayItems` to guarantee every `type: "array"` schema defines an `items` field, preventing Gemini API rejection (`400 INVALID_ARGUMENT: Cannot find field items`).
  - Added regression test cases in `tests/unit/gemini-mcp-schema-cleaner-2884.test.js`.

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
