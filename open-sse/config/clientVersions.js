// Single source of truth for upstream client versions, user-agents, and
// editor/CLI fingerprints that zenrouter spoofs in outbound requests.
//
// Why this exists: previously each provider scattered its User-Agent,
// editor-version, client_version, and plugin-version strings across
// the registry, executor, oauth service, and tests. That caused split-
// brain (Cursor transport said 3.12.17 while OAuth said 3.12.17 but the
// usage handler said something else) and made it impossible to bump
// versions in one place.
//
// Sources verified 2026-10-01 against:
//   - Claude Code 2.1.286                          (npm @anthropic-ai/claude-code latest,
//     published 2026-09-30; supports Claude Opus 5.5, Fable 5.1 and updated beta flags)
//   - @openai/codex 0.159.3                       (npm latest 2026-09-30)
//   - @google/gemini-cli 0.62.0                   (npm latest; core still pins
//     @google/genai@1.30.0 exact in packages/core/package.json at v0.62.0)
//   - google-antigravity/antigravity IDE 2.14.0 / CLI 1.1.25 (antigravity.google/changelog, Sep 2026)
//   - Antigravity IDE Desktop 2.14.0               (official changelog: integrated terminal & Git, long conversation history optimization)
//   - microsoft/vscode 1.140.0 tag: bundled extensions/copilot = copilot-chat
//     0.68.0 (verified from extensions/copilot/package.json at tag 1.140.0)
//   - Kiro IDE 1.2.4 / CLI 2.26.0                  (kiro.dev/changelog, 2026-09-30)
//   - TraeCode IDE 3.5.91                          (trae docs changelog:
//     3.5.89–3.5.91 Aug 19 hotfix)
//   - CodeBuddy CLI 2.161.0                        (@tencent-ai/codebuddy-code npm latest)
//   - Grok Build 1.0.44                            (x.ai/cli stable channel pointer via
//     @xai-official/grok npm latest; UA/pager/shell shape captured from official HAR traffic)
//   - Kimchi CLI 1.3.0                             (getkimchi/kimchi GitHub release, v1.3.0)
//   - zed-industries/zed 1.22.0                    (stable channel, GitHub release v1.22.0)
//   - Cursor 3.22.12, OpenCode 1.18.34, Windsurf/Devin Desktop 3.10.48 (2026-09-29)
//
// Update policy: bump these in lockstep with the corresponding upstream
// release, then run tests/__baseline__/verify-no-regression.mjs.

import { platform, arch } from "os";

// ─── Claude Code (claude-cli) ──────────────────────────────────────────
// 2.1.286 (2026-09-30) — latest release; supports Opus 5.5, Fable 5.1 and updated flags.
export const CLAUDE_CODE_VERSION = "2.1.286";
export const CLAUDE_CLI_USER_AGENT = `claude-cli/${CLAUDE_CODE_VERSION} (external, sdk-cli)`;

// Anthropic-Beta flag set — Anthropic adds/removes flags per release. We
// pass the full set; the heavy-agent flags (advanced-tool-use, effort) are
// gated to opus/sonnet via selectAnthropicBeta() in shared.js.
//
// Every flag here must be one Anthropic accepts for ANY enrolled account.
// Flags that are gated per-organization (the client only sends them once the
// server hands it an entitlement) must NOT be listed: the upstream answers the
// whole request with
//   400 Unexpected value(s) `timing-2026-09-09` for the `anthropic-beta` header
// `timing-2026-09-09` is exactly such a flag — it is the client's internal
// per-turn timing telemetry beta and carries no routing behavior for a gateway.
// selectAnthropicBeta() additionally strips any flag the upstream names in that
// 400 (see parseRejectedAnthropicBetaFlags), so a future entitlement change
// self-heals instead of breaking the turn.
export const CLAUDE_BETA_FLAGS_BASE = [
  "claude-code-20250219",
  "oauth-2025-04-20",
  "interleaved-thinking-2025-05-14",
  "context-management-2025-06-27",
  "prompt-caching-scope-2026-01-05",
  "structured-outputs-2025-12-15",
  "fast-mode-2026-02-01",
  "redact-thinking-2026-02-12",
  "tool-search-tool-2025-10-19",
  "dangerous-tool-use-2026-09-03",
  "inline-tools-2026-09-15",
];
export const CLAUDE_BETA_FLAGS_HEAVY_AGENT = [
  "advanced-tool-use-2025-11-20",
  "effort-2025-11-24",
];

// X-Stainless-* fingerprint — Node 24.14 is the new minimum; bundled SDK is
// @anthropic-ai/sdk 0.127.0 (verified in Claude Code 2.1.286 native binary).
export const CLAUDE_STAINLESS = {
  helperMethod: "stream",
  retryCount: "0",
  runtimeVersion: "v24.14.0",
  packageVersion: "0.127.0",
  runtime: "node",
  timeout: "600",
};

// ─── OpenAI Codex ──────────────────────────────────────────────────────
// 0.159.3 (npm latest 2026-09-30). Two surfaces:
//   - codex_cli_rs/<v>  → User-Agent header on /responses, /chat, /v1/chat
//   - ?client_version=  → query param on /backend-api/codex/models (gating)
export const CODEX_CLI_VERSION = "0.159.3";
export const CODEX_USER_AGENT = `codex_cli_rs/${CODEX_CLI_VERSION}`;
// Antigravity-style codex_cli_rs gating is identical.
export const CODEX_MODELS_CLIENT_VERSION = CODEX_CLI_VERSION;

// ─── GitHub Copilot ────────────────────────────────────────────────────
// VSCode 1.140.0 is the latest stable. The copilot-chat version
// that matters is the one BUNDLED in the VS Code release tag `1.140.0`
// (extensions/copilot/package.json → 0.68.0); the marketplace standalone
// standalone lags the bundled extension. Pairing
// vscode/1.140.0 with anything other than 0.68.0 looks inconsistent upstream.
export const VSCODE_VERSION = "1.140.0";
export const COPILOT_CHAT_VERSION = "0.68.0";
export const COPILOT_USER_AGENT = `GitHubCopilotChat/${COPILOT_CHAT_VERSION}`;
export const COPILOT_API_VERSION = "2025-04-01";

// ─── Cursor ────────────────────────────────────────────────────────────
// 3.22.12 (2026-09-30). The checksum (jyh cipher: XOR rolling key + base64)
// in open-sse/utils/cursorChecksum.js is upstream's algorithm; if Cursor
// changes it, the import flow must be revalidated end-to-end with a real
// credential before bumping. Verified algorithm unchanged as of 2026-08-25.
export const CURSOR_VERSION = "3.22.12";
export const CURSOR_CONNECT_ES_VERSION = "1.6.1";

// ─── Antigravity ───────────────────────────────────────────────────────
// Antigravity IDE Desktop 2.14.0 (2026-09-22: integrated terminal & Git, long conversation history optimization).
// Antigravity CLI is on a separate line (1.1.25, released 2026-09-03) — the IDE is what we impersonate.
export const ANTIGRAVITY_IDE_VERSION = "2.14.0";
export const ANTIGRAVITY_IDE_USER_AGENT = (() => {
  // macOS arm64 is the official captured fingerprint; we keep the
  // platform stable even when zenrouter runs on Linux/Windows because
  // the upstream profile is matched to the IDE client, not the host.
  const os = platform();
  const a = arch();
  const osToken = os === "darwin"
    ? (a === "arm64" ? "darwin/arm64" : "darwin/x64")
    : os === "win32"
      ? (a === "arm64" ? "windows/arm64" : "windows/x64")
      : (a === "arm64" ? "linux/arm64" : "linux/x64");
  return `antigravity/ide/${ANTIGRAVITY_IDE_VERSION} ${osToken}`;
})();

// Antigravity MITM override is now opt-in. Default OFF — upstream
// 2.x rejects the legacy 1.x fingerprint and forcing it breaks
// production IDE users. Set MITM_ANTIGRAVITY_VERSION_OVERRIDE=true to
// re-enable for compatibility tests.
export const ANTIGRAVITY_MITM_VERSION_OVERRIDE_ENABLED =
  process.env.MITM_ANTIGRAVITY_VERSION_OVERRIDE === "true";
export const ANTIGRAVITY_MITM_VERSION = ANTIGRAVITY_IDE_VERSION;

// ─── Gemini CLI ────────────────────────────────────────────────────────
// 0.62.0 (npm latest 2026-09-30). The apiClient string must mirror the @google/genai
// version PINNED by that exact gemini-cli release (packages/core/package.json
// pins "@google/genai": "1.30.0" — no caret, still true at v0.62.0), otherwise the sdk/node pair
// looks fabricated to upstream.
export const GEMINI_CLI_VERSION = "0.62.0";
export const GEMINI_CLI_API_CLIENT = `google-genai-sdk/1.30.0 gl-node/v22.19.0`;

// ─── Kiro ──────────────────────────────────────────────────────────────
// Two distinct upstream lines:
//   - IDE line 1.2.x (1.2.4 is the newest published, 2026-09-30: Workflows) → client fingerprint
//   - CLI line 2.26.0 (2026-09-30)
//
// The runtime UA uses kiro-ide/<v> as the dominant client identifier;
// the aws-sdk-js wrapper is the underlying SDK prefix.
export const KIRO_IDE_VERSION = "1.2.4";
export const KIRO_CLI_VERSION = "2.26.0";
export const KIRO_AWS_SDK_VERSION = "3.0.0";
export const KIRO_RUNTIME_SDK_VERSION = "3.0.0";
export const KIRO_USER_AGENT = `AWS-SDK-JS/${KIRO_AWS_SDK_VERSION} kiro-ide/${KIRO_IDE_VERSION}`;
export const KIRO_AMZ_USER_AGENT = `aws-sdk-js/${KIRO_AWS_SDK_VERSION} KiroIDE-${KIRO_IDE_VERSION}`;
// Token refresh / profile-discovery surface identifies as the CLI, not the IDE.
// Was hardcoded as "kiro-cli/1.0.0" in executors/default.js and
// services/tokenRefresh/providers.js, which drifted from KIRO_CLI_VERSION.
export const KIRO_CLI_USER_AGENT = `kiro-cli/${KIRO_CLI_VERSION}`;

// Build the per-request fingerprint (matches Kiro IDE >1.0.228 where
// GenerateAssistantResponse moved to POST / + x-amz-target header).
export const KIRO_FINGERPRINT = ({
  kiroAgentOs = "windows",
  kiroAgentOsVersion = "10.0.26200",
  kiroNodeVersion = "22.21.1",
  machineId = "",
} = {}) => ({
  userAgent:
    `aws-sdk-js/${KIRO_RUNTIME_SDK_VERSION} ua/2.1 ` +
    `os/${kiroAgentOs}#${kiroAgentOsVersion} ` +
    `lang/js md/nodejs#${kiroNodeVersion} ` +
    `api/codewhispererruntime#${KIRO_RUNTIME_SDK_VERSION} m/N,E ` +
    `KiroIDE-${KIRO_IDE_VERSION}-${machineId}`,
  amzUserAgent:
    `aws-sdk-js/${KIRO_RUNTIME_SDK_VERSION} KiroIDE-${KIRO_IDE_VERSION}-${machineId}`,
});

// ─── Trae ──────────────────────────────────────────────────────────────
// 3.5.91 (Aug 19, 2026 hotfix range 3.5.89–3.5.91).
// appVersion is sent in common_params of SOLO session init.
export const TRAE_APP_VERSION = "3.5.91";
export const TRAE_USER_AGENT = "Trae/1.0.0 antigravity-cockpit-tools";

// ─── CodeBuddy (Tencent) ───────────────────────────────────────────────
// CLI 2.161.0 (npm @tencent-ai/codebuddy-code latest, 2026-09-30). Two surfaces
// (transport vs OAuth plugin) used different versions previously; keep
// them aligned to avoid the upstream rejecting the older plugin UA.
export const CODEBUDDY_CLI_VERSION = "2.161.0";
export const CODEBUDDY_CN_TRANSPORT_UA = `CLI/${CODEBUDDY_CLI_VERSION} CodeBuddy/${CODEBUDDY_CLI_VERSION}`;
export const CODEBUDDY_INTL_TRANSPORT_UA = `IDE/${CODEBUDDY_CLI_VERSION} CodeBuddy/${CODEBUDDY_CLI_VERSION}`;
export const CODEBUDDY_CN_OAUTH_UA = CODEBUDDY_CN_TRANSPORT_UA;
export const CODEBUDDY_INTL_OAUTH_UA = CODEBUDDY_INTL_TRANSPORT_UA;

// ─── Grok CLI / Grok Build ─────────────────────────────────────────────
// 1.0.44 (x.ai/cli stable channel pointer, 2026-09-30). Both oauth handshake
// and runtime executor use the same version to avoid signature mismatch.
export const GROK_CLI_VERSION = "1.0.44";
export const GROK_CLI_CLIENT_IDENTIFIER = "grok-shell";
export const GROK_CLI_USER_AGENT =
  `grok-pager/${GROK_CLI_VERSION} grok-shell/${GROK_CLI_VERSION} (linux; x86_64)`;
// xAI discovery-time UA — not pinned to a specific version (xAI does
// not gate on user-agent for api.x.ai).
export const XAI_USER_AGENT = "grok-cli/zenrouter";

// ─── Kimchi ────────────────────────────────────────────────────────────
// We impersonate the public CLI (getkimchi/kimchi GitHub releases): latest
// v1.3.0 (2026-09-30). The kimchi.dev hero screenshot still shows v0.0.26
// — stale marketing asset, do not trust it.
export const KIMCHI_GATEWAY_VERSION = "1.3.0";
export const KIMCHI_USER_AGENT = `kimchi/${KIMCHI_GATEWAY_VERSION}`;

// ─── Zed ───────────────────────────────────────────────────────────────
// 1.22.0 (stable channel, 2026-09-30). x-zed-version header fallback when the client
// does not provide appVersion via providerSpecificData.
export const ZED_VERSION = "1.22.0";
export const ZED_USER_AGENT = "zenrouter/zed";
export const ZED_DEFAULT_APP_VERSION = ZED_VERSION;

// ─── iFlow ─────────────────────────────────────────────────────────────
// No public release cadence. Static UA — no version pin.
export const IFLOW_USER_AGENT = "iFlow-Cli";

// ─── Windsurf / Devin Desktop (Codeium) ────────────────────────────────
// 3.10.48 — latest STABLE desktop release (windsurf.com/changelog, 2026-09-29).
// The IDE and its bundled extension ship the same number. Previously hardcoded
// as 3.14.0 in executors/windsurf.js, a version that does not exist: spoofing a
// future release is against the fingerprint policy (never fabricate versions)
// and upstream can flag the account for it.
export const WINDSURF_IDE_VERSION = "3.10.48";

// ─── OpenCode (free-tier identity) ─────────────────────────────────────
// 1.18.34 (npm opencode-ai latest). The free-tier backend gates on client
// identity: `User-Agent: opencode` and non-canonical x-opencode-session values
// fail with 403 FreeTierError, so the version must stay a real release at or
// above the minimum it enforces.
export const OPENCODE_VERSION = "1.18.34";
export const OPENCODE_USER_AGENT = `opencode/${OPENCODE_VERSION}`;

// ─── Qoder CLI ─────────────────────────────────────────────────────────
// 1.1.65 (@qoder-ai/qodercli npm latest). Used for model discovery; the
// Cosy-Version header is signature-bound separately in shared/qoder/cosy.js.
export const QODER_CLI_VERSION = "1.1.65";
