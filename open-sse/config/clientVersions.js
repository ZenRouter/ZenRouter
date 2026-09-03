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
// Sources verified 2026-08-25 against:
//   - Claude Code 2.1.241                          (anthropics/claude-code GitHub
//     release + CHANGELOG.md; npm is now only a native-installer stub — the
//     registry tarball ships a `claude.exe` bootstrap, so version sourcing is
//     GitHub-first, npm-last-resort)
//   - @openai/codex 0.149.1 (codex-rs)             (GitHub release)
//   - @google/gemini-cli 0.56.0                    (GitHub release; pins
//     @google/genai@1.30.0 exact in packages/core/package.json)
//   - google-antigravity/antigravity-cli 1.1.20    (GitHub release)
//   - Antigravity IDE Desktop 2.10.0               (official changelog/releases)
//   - microsoft/vscode 1.134.0 tag: bundled extensions/copilot = copilot-chat
//     0.63.0 (main already carries 0.64.0 targeting 1.135; the marketplace
//     standalone stalled at 0.48.1 — bundled-in-VSCode is what real users run)
//   - Kiro IDE 1.0.337 / CLI 2.19.1                (kiro.dev/changelog)
//   - TraeCode IDE 3.5.87                          (trae docs changelog:
//     3.5.84–3.5.86 Aug 7 feature release, 3.5.87 Aug 10 hotfix)
//   - CodeBuddy CLI 2.138.0                        (@tencent-ai/codebuddy-code npm)
//   - @xai-official/grok 1.0.5                     (npm)
//   - Kimchi CLI 1.0.3                             (getkimchi/kimchi GitHub releases;
//     upstream crossed to 1.x on Aug 21, kimchi.dev hero screenshot is stale)
//   - zed-industries/zed 1.16.2                    (GitHub release)
//
// Update policy: bump these in lockstep with the corresponding upstream
// release, then run tests/__baseline__/verify-no-regression.mjs.

import { platform, arch } from "os";

// ─── Claude Code (claude-cli) ──────────────────────────────────────────
// 2.1.257 (2026-08-30) — latest GitHub release; CHANGELOG.md top entry matches.
// npm distribution is deprecated (stub installer); UA format unchanged in the
// native builds. Beta-flag list mirrors 2.1.x runtime; some flags are
// opus/sonnet-gated.
export const CLAUDE_CODE_VERSION = "2.1.257";
export const CLAUDE_CLI_USER_AGENT = `claude-cli/${CLAUDE_CODE_VERSION} (external, sdk-cli)`;

// Anthropic-Beta flag set — Anthropic adds/removes flags per release. We
// pass the full set; the heavy-agent flags (advanced-tool-use, effort) are
// gated to opus/sonnet via selectAnthropicBeta() in shared.js.
export const CLAUDE_BETA_FLAGS_BASE = [
  "claude-code-20250219",
  "oauth-2025-04-20",
  "interleaved-thinking-2025-05-14",
  "context-management-2025-06-27",
  "prompt-caching-scope-2026-01-05",
  "structured-outputs-2025-12-15",
  "fast-mode-2026-02-01",
  "redact-thinking-2026-02-12",
  "token-efficient-tools-2026-03-28",
];
export const CLAUDE_BETA_FLAGS_HEAVY_AGENT = [
  "advanced-tool-use-2025-11-20",
  "effort-2025-11-24",
];

// X-Stainless-* fingerprint — Node 24.14 is the new minimum; bumped from
// v22.19 (was used in 2.1.x earlier this year).
export const CLAUDE_STAINLESS = {
  helperMethod: "stream",
  retryCount: "0",
  runtimeVersion: "v24.14.0",
  packageVersion: "0.80.0",
  runtime: "node",
  timeout: "600",
};

// ─── OpenAI Codex ──────────────────────────────────────────────────────
// 0.149.1 (2026-08-24). Two surfaces:
//   - codex_cli_rs/<v>  → User-Agent header on /responses, /chat, /v1/chat
//   - ?client_version=  → query param on /backend-api/codex/models (gating)
export const CODEX_CLI_VERSION = "0.149.1";
export const CODEX_USER_AGENT = `codex_cli_rs/${CODEX_CLI_VERSION}`;
// Antigravity-style codex_cli_rs gating is identical.
export const CODEX_MODELS_CLIENT_VERSION = CODEX_CLI_VERSION;

// ─── GitHub Copilot ────────────────────────────────────────────────────
// VSCode 1.134.0 (2026-08-19) is the latest stable. The copilot-chat version
// that matters is the one BUNDLED in the VS Code release tag `1.134.0`
// (extensions/copilot/package.json → 0.63.0); the marketplace standalone
// stalled at 0.48.1 and main carries 0.64.0 for the upcoming 1.135. Pairing
// vscode/1.134.0 with anything other than 0.63.0 looks inconsistent upstream.
export const VSCODE_VERSION = "1.134.0";
export const COPILOT_CHAT_VERSION = "0.63.0";
export const COPILOT_USER_AGENT = `GitHubCopilotChat/${COPILOT_CHAT_VERSION}`;
export const COPILOT_API_VERSION = "2025-04-01";

// ─── Cursor ────────────────────────────────────────────────────────────
// 3.17.8 (2026-08-20). The checksum (jyh cipher: XOR rolling key + base64)
// in open-sse/utils/cursorChecksum.js is upstream's algorithm; if Cursor
// changes it, the import flow must be revalidated end-to-end with a real
// credential before bumping. Verified algorithm unchanged as of 2026-08-25.
export const CURSOR_VERSION = "3.17.8";
export const CURSOR_CONNECT_ES_VERSION = "1.6.1";

// ─── Antigravity ───────────────────────────────────────────────────────
// Antigravity IDE Desktop 2.11.0 (2026-08-28: Gemini 3.8 Flash support, daily host quota).
// Antigravity CLI is on a separate line (1.1.20, released 2026-08-25) — the IDE is what we impersonate.
export const ANTIGRAVITY_IDE_VERSION = "2.11.0";
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
// 0.56.0 (2026-08-19). The apiClient string must mirror the @google/genai
// version PINNED by that exact gemini-cli release (packages/core/package.json
// pins "@google/genai": "1.30.0" — no caret), otherwise the sdk/node pair
// looks fabricated to upstream.
export const GEMINI_CLI_VERSION = "0.56.0";
export const GEMINI_CLI_API_CLIENT = `google-genai-sdk/1.30.0 gl-node/v22.19.0`;

// ─── Kiro ──────────────────────────────────────────────────────────────
// Two distinct upstream lines:
//   - IDE line 1.0.x (1.0.337 is the newest published) → client fingerprint
//   - CLI line 2.19.0 (Aug 21, 2026, patched to 2.19.1 same day)
//
// The runtime UA uses kiro-ide/<v> as the dominant client identifier;
// the aws-sdk-js wrapper is the underlying SDK prefix.
export const KIRO_IDE_VERSION = "1.0.337";
export const KIRO_CLI_VERSION = "2.19.1";
export const KIRO_AWS_SDK_VERSION = "3.0.0";
export const KIRO_RUNTIME_SDK_VERSION = "3.0.0";
export const KIRO_USER_AGENT = `AWS-SDK-JS/${KIRO_AWS_SDK_VERSION} kiro-ide/${KIRO_IDE_VERSION}`;
export const KIRO_AMZ_USER_AGENT = `aws-sdk-js/${KIRO_AWS_SDK_VERSION} KiroIDE-${KIRO_IDE_VERSION}`;

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
// 3.5.87 (Aug 10, 2026 hotfix; 3.5.84–3.5.86 was the Aug 7 feature release).
// appVersion is sent in common_params of SOLO session init.
export const TRAE_APP_VERSION = "3.5.87";
export const TRAE_USER_AGENT = "Trae/1.0.0 antigravity-cockpit-tools";

// ─── CodeBuddy (Tencent) ───────────────────────────────────────────────
// CLI 2.138.0 (npm @tencent-ai/codebuddy-code, Aug 2026). Two surfaces
// (transport vs OAuth plugin) used different versions previously; keep
// them aligned to avoid the upstream rejecting the older plugin UA.
export const CODEBUDDY_CLI_VERSION = "2.138.0";
export const CODEBUDDY_CN_TRANSPORT_UA = `CLI/${CODEBUDDY_CLI_VERSION} CodeBuddy/${CODEBUDDY_CLI_VERSION}`;
export const CODEBUDDY_INTL_TRANSPORT_UA = `IDE/${CODEBUDDY_CLI_VERSION} CodeBuddy/${CODEBUDDY_CLI_VERSION}`;
export const CODEBUDDY_CN_OAUTH_UA = CODEBUDDY_CN_TRANSPORT_UA;
export const CODEBUDDY_INTL_OAUTH_UA = CODEBUDDY_INTL_TRANSPORT_UA;

// ─── Grok CLI / Grok Build ─────────────────────────────────────────────
// 1.0.5 (2026-08-22). Both oauth handshake and runtime executor use
// the same version to avoid signature mismatch.
export const GROK_CLI_VERSION = "1.0.5";
export const GROK_CLI_CLIENT_IDENTIFIER = "grok-shell";
export const GROK_CLI_USER_AGENT =
  `grok-pager/${GROK_CLI_VERSION} grok-shell/${GROK_CLI_VERSION} (linux; x86_64)`;
// xAI discovery-time UA — not pinned to a specific version (xAI does
// not gate on user-agent for api.x.ai).
export const XAI_USER_AGENT = "grok-cli/zenrouter";

// ─── Kimchi ────────────────────────────────────────────────────────────
// We impersonate the public CLI (getkimchi/kimchi GitHub releases): the 1.x
// line opened with v1.0.0 on Aug 21, 2026; latest is v1.0.3 (Aug 24). The
// kimchi.dev hero screenshot still shows v0.0.26 — stale marketing asset,
// do not trust it.
export const KIMCHI_GATEWAY_VERSION = "1.0.3";
export const KIMCHI_USER_AGENT = `kimchi/${KIMCHI_GATEWAY_VERSION}`;

// ─── Zed ───────────────────────────────────────────────────────────────
// 1.16.2 (2026-08-24). x-zed-version header fallback when the client
// does not provide appVersion via providerSpecificData.
export const ZED_VERSION = "1.16.2";
export const ZED_USER_AGENT = "zenrouter/zed";
export const ZED_DEFAULT_APP_VERSION = ZED_VERSION;

// ─── iFlow ─────────────────────────────────────────────────────────────
// No public release cadence. Static UA — no version pin.
export const IFLOW_USER_AGENT = "iFlow-Cli";
