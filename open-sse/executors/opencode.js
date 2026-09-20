import crypto from "crypto";
import { BaseExecutor } from "./base.js";
import { PROVIDERS } from "../config/providers.js";
import { getThinkingLevels } from "../providers/thinkingLevels.js";
import { injectReasoningContent } from "../utils/reasoningContentInjector.js";
import { resolveSessionId } from "../utils/sessionManager.js";

const OPENCODE_UA = "opencode/1.18.31";
// Models served by /zen/v1/responses; every other model stays on /chat/completions.
const RESPONSES_MODELS = new Set([
  "muse-spark-1.2-contributor-free",
  "muse-spark-1.3-contributor-free",
]);

// Canonical upstream id formats (reverse-engineered from opencode-ai@1.18.31,
// verified on npm; the Zen backend 403s anything else with FreeTierError):
//   session: ses_ + 12 hex timestamp digits + 14 Base62 chars
//   request: msg_ + 32 hex chars, stable per turn (session + last user message)
const CANONICAL_SESSION_RE = /^ses_[0-9a-f]{12}[0-9A-Za-z]{14}$/;
const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const MAX_CANONICAL_SESSIONS = 1000;
const canonicalSessionCache = new Map(); // derivedId -> canonical ses_ id

function mintCanonicalSessionId() {
  const ts = Date.now().toString(16).padStart(12, "0").slice(-12);
  const rand = Array.from(crypto.randomBytes(14), (b) => BASE62[b % 62]).join("");
  return `ses_${ts}${rand}`;
}

function canonicalizeOpencodeSession(id) {
  if (typeof id === "string" && CANONICAL_SESSION_RE.test(id)) return id;
  // Non-canonical derived ids (binary-style store values, legacy ses_32hex)
  // map to ONE stable canonical id each — minting fresh per request burns
  // upstream per-session free-tier quota (#4117 pattern).
  let canonical = canonicalSessionCache.get(id);
  if (!canonical) {
    canonical = mintCanonicalSessionId();
    if (canonicalSessionCache.size >= MAX_CANONICAL_SESSIONS) {
      canonicalSessionCache.delete(canonicalSessionCache.keys().next().value);
    }
    canonicalSessionCache.set(id, canonical);
  }
  return canonical;
}

// Test-only: reset the derived→canonical map between cases.
export function _resetOpencodeSessionCache() {
  canonicalSessionCache.clear();
}

// Test seam: canonical-format helpers (unit-tested, not part of the hot path).
export { CANONICAL_SESSION_RE, mintCanonicalSessionId, canonicalizeOpencodeSession, deriveRequestId };

function lastUserText(body) {
  const messages = body?.messages || body?.input;
  if (!Array.isArray(messages)) return null;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role !== "user") continue;
    const c = m?.content;
    if (typeof c === "string" && c.trim()) return c;
    if (Array.isArray(c)) {
      const text = c.filter((p) => typeof p?.text === "string").map((p) => p.text).join("\n").trim()
        || c.filter((p) => typeof p?.input_text === "string").map((p) => p.input_text).join("\n").trim();
      if (text) return text;
    }
  }
  return null;
}

function deriveRequestId(sessionId, body) {
  const text = lastUserText(body);
  if (sessionId && text !== null) {
    return `msg_${crypto.createHash("sha256").update(`${sessionId}|${text}`).digest("hex").slice(0, 32)}`;
  }
  return `msg_${crypto.randomUUID().replace(/-/g, "")}`;
}

// Strip the thinking suffix "model(level)" so registry lookups hit the base id.
function baseModelId(model) {
  return String(model || "").replace(/\([^()]+\)\s*$/, "").trim();
}

function isResponsesModel(model) {
  const base = baseModelId(model);
  return /muse/i.test(base) || RESPONSES_MODELS.has(base);
}

function resolveOpencodeSession(body, credentials) {
  const headers = credentials?.rawHeaders || {};
  const resolved = resolveSessionId({
    headers,
    body,
    connectionId: credentials?.connectionId,
    scope: "opencode",
  });
  return canonicalizeOpencodeSession(resolved);
}

function normalizeOpencodeReasoning(model, body) {
  const current = body.reasoning;
  const currentReasoning = current && typeof current === "object" && !Array.isArray(current)
    ? current
    : null;
  const requestedEffort = typeof body.reasoning_effort === "string"
    ? body.reasoning_effort
    : currentReasoning?.effort;
  if (typeof requestedEffort !== "string") return;

  const cleanModel = baseModelId(model || body.model);
  const supportedLevels = getThinkingLevels("opencode", cleanModel);
  let effort = requestedEffort.toLowerCase().trim();
  if ((effort === "max" || effort === "ultra") && supportedLevels?.length && !supportedLevels.includes(effort)) {
    if (effort === "ultra" && supportedLevels.includes("max")) effort = "max";
    else if (supportedLevels.includes("xhigh")) effort = "xhigh";
  }

  // Muse Spark models on OpenCode free tier only accept minimal|low|medium|high;
  // xhigh/max/ultra triggers 500/400 from the Console (#4149).
  if (cleanModel.includes("muse-spark")) {
    if (effort === "xhigh" || effort === "max" || effort === "ultra") {
      effort = "high";
    }
  }

  body.reasoning = { ...currentReasoning, effort };
  if (!body.reasoning.summary) body.reasoning.summary = "auto";
  delete body.reasoning_effort;
}

// OpenCode free tier requires both 'bash' and 'read' in tools payload.
// Injected as cloaked decoy tools so external CLI tools (e.g. Claude Code's Bash/Read)
// take precedence while satisfying upstream verification.
export const OPENCODE_DECOY_CHAT_TOOLS = [
  {
    type: "function",
    function: {
      name: "bash",
      description: "This tool is currently unavailable and must not be used.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "read",
      description: "This tool is currently unavailable and must not be used.",
      parameters: { type: "object", properties: {} },
    },
  },
];

export const OPENCODE_DECOY_RESPONSES_TOOLS = [
  {
    type: "function",
    name: "bash",
    description: "This tool is currently unavailable and must not be used.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "read",
    description: "This tool is currently unavailable and must not be used.",
    parameters: { type: "object", properties: {} },
  },
];

function cloakOpencodeTools(body, isResponses) {
  if (!body || typeof body !== "object") return;
  if (isResponses) {
    const hasTools = Array.isArray(body.tools) && body.tools.length > 0;
    if (!hasTools) body.tools = [];
    const exactNames = new Set(body.tools.map((t) => t?.name || t?.function?.name || ""));
    for (const tool of OPENCODE_DECOY_RESPONSES_TOOLS) {
      if (!exactNames.has(tool.name)) body.tools.push({ ...tool });
    }
    if (!hasTools && !body.tool_choice) body.tool_choice = "auto";
  } else {
    const hasTools = Array.isArray(body.tools) && body.tools.length > 0;
    if (!hasTools) {
      body.tools = OPENCODE_DECOY_CHAT_TOOLS.map((t) => ({ ...t, function: { ...t.function } }));
      if (!body.tool_choice) body.tool_choice = "none";
    } else {
      const exactNames = new Set(body.tools.map((t) => t?.function?.name || t?.name || ""));
      for (const tool of OPENCODE_DECOY_CHAT_TOOLS) {
        if (!exactNames.has(tool.function.name)) {
          body.tools.push({ ...tool, function: { ...tool.function } });
        }
      }
    }
  }
}

export class OpenCodeExecutor extends BaseExecutor {
  constructor() {
    super("opencode", PROVIDERS.opencode);
    this._currentSessionId = null;
    this._currentRequestId = null;
  }

  transformRequest(model, body, stream, credentials) {
    this._currentSessionId = resolveOpencodeSession(body, credentials);
    this._currentRequestId = deriveRequestId(this._currentSessionId, body);
    const responses = isResponsesModel(model);
    if (responses) {
      // Responses API names the output cap max_output_tokens and takes thinking
      // as reasoning:{effort,summary} — normalize the Chat fields at this boundary.
      if (body.max_output_tokens === undefined) {
        if (body.max_completion_tokens !== undefined) body.max_output_tokens = body.max_completion_tokens;
        else if (body.max_tokens !== undefined) body.max_output_tokens = body.max_tokens;
      }
      delete body.max_tokens;
      delete body.max_completion_tokens;
      normalizeOpencodeReasoning(model, body);
      cloakOpencodeTools(body, true);
    } else if (body && typeof body === "object") {
      cloakOpencodeTools(body, false);
    }
    return injectReasoningContent({ provider: this.provider, model, body });
  }

  buildUrl(model) {
    const base = this.config.baseUrl;
    return isResponsesModel(model)
      ? `${base}/zen/v1/responses`
      : `${base}/zen/v1/chat/completions`;
  }

  buildHeaders(credentials, stream = true) {
    const raw = credentials?.rawHeaders || {};
    const lower = {};
    for (const [k, v] of Object.entries(raw)) lower[k.toLowerCase()] = v;

    const downstreamUa = lower["user-agent"] || "";
    const isOpencodeDownstream = downstreamUa.toLowerCase().includes("opencode");

    return {
      "Content-Type": "application/json",
      "Authorization": "Bearer public",
      "User-Agent": isOpencodeDownstream ? downstreamUa : OPENCODE_UA,
      "x-opencode-client": lower["x-opencode-client"] || "desktop",
      "x-opencode-session": lower["x-opencode-session"] || this._currentSessionId || mintCanonicalSessionId(),
      "x-opencode-request": lower["x-opencode-request"] || this._currentRequestId || deriveRequestId(null, {}),
      "x-opencode-project": lower["x-opencode-project"] || "global",
      "Accept": stream ? "text/event-stream" : "*/*",
    };
  }
}
