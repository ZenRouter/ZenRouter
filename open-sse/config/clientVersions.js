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
// App releases checked 2026-10-02 against publisher-controlled sources:
//   https://registry.npmjs.org/@anthropic-ai/claude-code (latest 2.1.287;
//     explicit stable channel 2.1.285). Use the non-prerelease latest release.
//   https://registry.npmjs.org/@openai/codex/latest (0.160.0, 2026-10-01)
//   https://registry.npmjs.org/@google/gemini-cli/latest (0.62.0, 2026-09-29);
//     v0.62.0/packages/core/package.json pins @google/genai exactly 1.30.0.
//   https://antigravity.google/changelog: IDE 2.5.5 (2026-08-13),
//     CLI 1.2.12 (2026-09-27), Hub 2.19.1 (2026-09-30). Distinct surfaces:
//     the previous IDE 2.14.0 incorrectly came from the Hub release line.
//   https://update.code.visualstudio.com/api/update/win32-x64-user/stable/latest:
//     VS Code 1.140.0; tagged extensions/copilot/package.json is 0.68.0.
//   https://kiro.dev/changelog/ide/1-2 (IDE 1.2.4) and /cli/2-26 (CLI 2.26.0).
//   https://registry.npmjs.org/@tencent-ai/codebuddy-code/latest (2.161.1).
//   https://x.ai/cli/stable (1.0.46; alpha releases are not selected).
//   https://github.com/getkimchi/kimchi/releases/tag/v1.5.0 (2026-10-01).
//   https://github.com/zed-industries/zed/releases/tag/v1.22.0 (unchanged).
//   Cursor golden download redirects to 3.22.12; OpenCode 1.18.34,
//     Qoder CLI 1.1.65, Trae 3.5.91 and Devin Desktop 3.10.48 remain current.
//
// App release verification does not verify bundled SDK/runtime or entitlement
// flags. Retain unverified wire pins rather than substituting public SDK latest;
// validate outbound protocol behavior and regression baselines after changes.

import { platform, arch } from "os";

// ─── Claude Code (claude-cli) ──────────────────────────────────────────
// npm latest non-prerelease 2.1.287 (2026-10-01); stable dist-tag is 2.1.285.
export const CLAUDE_CODE_VERSION = "2.1.287";
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

// Retained legacy wire profile. The native 2.1.287 bundle's SDK/runtime was not
// independently verified; npm launcher requires Node >=22, not this runtime pin.
export const CLAUDE_STAINLESS = {
  helperMethod: "stream",
  retryCount: "0",
  runtimeVersion: "v24.14.0",
  packageVersion: "0.127.0",
  runtime: "node",
  timeout: "600",
};

// ─── OpenAI Codex ──────────────────────────────────────────────────────
// 0.160.0 (npm latest non-prerelease, 2026-10-01). Two surfaces:
//   - codex_cli_rs/<v>  → User-Agent header on /responses, /chat, /v1/chat
//   - ?client_version=  → query param on /backend-api/codex/models (gating)
export const CODEX_CLI_VERSION = "0.160.0";
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
// IDE 2.5.5 (2026-08-13), separate from Hub 2.19.1 and CLI 1.2.12.
// Only the IDE wire profile is used here; do not substitute the Hub/CLI version.
export const ANTIGRAVITY_IDE_VERSION = "2.5.5";
export const ANTIGRAVITY_IDE_USER_AGENT = (() => {
  // Match the gateway host's platform; this is not a fixed captured macOS UA.
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
// 0.62.0 (npm latest stable, 2026-09-29). Its core manifest pins @google/genai
// exactly 1.30.0. The legacy gl-node runtime pin is retained, not independently
// verified as a fixed runtime of this release.
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
// CLI 2.161.1 (npm latest, 2026-10-01). Preserve existing transport/OAuth pairing.
// The INTL IDE-labelled wire shape is retained, not verified from the CLI release.
export const CODEBUDDY_CLI_VERSION = "2.161.1";
export const CODEBUDDY_CN_TRANSPORT_UA = `CLI/${CODEBUDDY_CLI_VERSION} CodeBuddy/${CODEBUDDY_CLI_VERSION}`;
export const CODEBUDDY_INTL_TRANSPORT_UA = `IDE/${CODEBUDDY_CLI_VERSION} CodeBuddy/${CODEBUDDY_CLI_VERSION}`;
export const CODEBUDDY_CN_OAUTH_UA = CODEBUDDY_CN_TRANSPORT_UA;
export const CODEBUDDY_INTL_OAUTH_UA = CODEBUDDY_INTL_TRANSPORT_UA;

// ─── Grok CLI / Grok Build ─────────────────────────────────────────────
// 1.0.46 (official stable channel, 2026-09-30). Preserve the existing wire shape;
// update version-dependent OAuth/runtime/catalog/billing identity together.
export const GROK_CLI_VERSION = "1.0.46";
export const GROK_CLI_CLIENT_IDENTIFIER = "grok-shell";
export const GROK_CLI_USER_AGENT =
  `grok-pager/${GROK_CLI_VERSION} grok-shell/${GROK_CLI_VERSION} (linux; x86_64)`;
// xAI discovery-time UA — not pinned to a specific version (xAI does
// not gate on user-agent for api.x.ai).
export const XAI_USER_AGENT = "grok-cli/zenrouter";

// ─── Kimchi ────────────────────────────────────────────────────────────
// Public CLI v1.5.0 (2026-10-01); tagged source uses kimchi/<release>.
export const KIMCHI_GATEWAY_VERSION = "1.5.0";
export const KIMCHI_USER_AGENT = `kimchi/${KIMCHI_GATEWAY_VERSION}`;

// ─── Zed ───────────────────────────────────────────────────────────────
// 1.22.0 (stable channel, 2026-09-30). x-zed-version header fallback when the client
// does not provide appVersion via providerSpecificData.
export const ZED_VERSION = "1.22.0";
export const ZED_USER_AGENT = "zenrouter/zed";
export const ZED_DEFAULT_APP_VERSION = ZED_VERSION;

// ─── iFlow ─────────────────────────────────────────────────────────────
// Static identity, not an app pin. Official CLI/API shutdown: 2026-04-17.
export const IFLOW_USER_AGENT = "iFlow-Cli";

// ─── Windsurf / Devin Desktop (Codeium) ────────────────────────────────
// 3.10.48 — latest STABLE desktop release (windsurf.com/changelog, 2026-09-29).
// Retain the existing IDE/extension wire pairing; the published desktop release
// alone does not independently verify its bundled extension protocol identity.
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
