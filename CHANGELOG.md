# Changelog

All notable changes to ZenRouter (fork of 9Router) will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/) and Conventional Commits.

## [Unreleased] - 2026-08-30

### Fixed

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
