// Concern: reasoning_effort ↔ provider-native thinking config.
// Gateway compatibility heuristics for level↔budget maps, not vendor guarantees.
// Provider-specific application lives in thinkingUnified.js; shared budget validation lives here.

// Discrete effort levels, ordered low→high.
export const EFFORT_LEVELS = ["minimal", "low", "medium", "high", "xhigh", "max"];

// Heuristic level → budget_tokens; clamp to the target model’s supported range.
export const LEVEL_TO_BUDGET = {
  none: 0,
  minimal: 512,
  low: 1024,
  medium: 8192,
  high: 24576,
  xhigh: 32768,
  max: 128000,
};

// Returns budget_tokens for an effort level, or undefined if unknown.
// 0 means "no thinking"; undefined means "effort not recognized".
export function effortToBudget(effort) {
  if (!effort) return undefined;
  return LEVEL_TO_BUDGET[String(effort).toLowerCase()];
}

// OpenAI reasoning_effort → Gemini thinkingLevel (gemini-3 enum: minimal|low|medium|high).
// Gemini 3 cannot fully disable thinking; "none"/"off" map to "minimal".
export function effortToThinkingLevel(effort) {
  const e = String(effort).toLowerCase().trim();
  if (e === "none" || e === "off") return "minimal";
  if (e === "xhigh" || e === "max" || e === "ultra") return "high";
  return e;
}

// Translation must defer the cap relationship for these candidates until the
// executor knows the actual outgoing beta and endpoint. This is not permission
// to send an oversized budget; final dispatch always reconciles it again.
export function supportsClaudeManualInterleaving(body, model) {
  return Array.isArray(body?.tools) && body.tools.length > 0 &&
    /^claude-(?:sonnet-4(?:[.-][56])?|opus-4(?:[.-][15])?)(?:-\d{8})?$/.test(model || "");
}

// Manual interleaving is model-gated as well as beta-gated.
export function allowsClaudeManualInterleaving(body, model, headers) {
  const beta = typeof headers?.get === "function" ? headers.get("anthropic-beta")
    : Object.entries(headers || {}).find(([key]) => key.toLowerCase() === "anthropic-beta")?.[1];
  return String(beta || "").split(",").map(value => value.trim()).includes("interleaved-thinking-2025-05-14") &&
    supportsClaudeManualInterleaving(body, model);
}

// Reconcile Anthropic manual thinking without ever increasing the output cap.
// The budget is a soft target. Interleaved tool turns have a documented exception
// to the ordinary budget < max_tokens relationship, gated at final dispatch.
export function reconcileClaudeThinkingBudget(body, allowInterleaved = false) {
  if (body?.thinking?.type !== "enabled") return body;
  const requested = body.thinking.budget_tokens;
  let budget = Number.isFinite(requested) && requested > 0 ? Math.max(1024, Math.floor(requested)) : 8192;
  const cap = body.max_tokens;
  if (cap !== undefined && cap !== null && Number.isFinite(cap)) {
    if (cap <= 0 || (!allowInterleaved && cap <= 1024)) {
      const error = new RangeError("max_tokens must exceed 1024 for enabled thinking; increase the output cap or disable thinking");
      error.code = "invalid_thinking_budget";
      throw error;
    }
    if (!allowInterleaved && budget >= cap) budget = Math.max(1024, Math.floor(cap) - 1024);
  }
  body.thinking = { ...body.thinking, budget_tokens: budget };
  return body;
}

// Numeric budget → nearest discrete level (reverse map via thresholds).
// Returns null when budget <= 0 (no reasoning).
export function budgetToLevel(budget) {
  const b = Number(budget);
  if (!b || b <= 0) return null;
  if (b <= 768) return "minimal";
  if (b <= 4096) return "low";
  if (b <= 16384) return "medium";
  if (b <= 28672) return "high";
  return "xhigh";
}

// Gemini thinkingBudget (numeric) → OpenAI reasoning_effort (antigravity reverse map).
export function budgetToEffort(budget) {
  if (!budget || budget <= 0) return null;
  if (budget <= 2048) return "low";
  if (budget <= 16384) return "medium";
  return "high";
}
