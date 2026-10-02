import { DEFAULT_MAX_TOKENS, DEFAULT_MIN_TOKENS, REASONING_MIN_OUTPUT_FLOOR } from "../../config/runtimeConfig.js";

/**
 * Adjust max_tokens based on request context
 * @param {object} body - Request body
 * @param {number} [ceiling=DEFAULT_MAX_TOKENS] - Upper bound for max_tokens.
 *   Callers with model context (e.g. openai-to-claude) pass the model's real
 *   maxOutput so high-output models (Opus 4.8 = 128000) aren't pre-clamped to
 *   the conservative default before the model-aware step sees them.
 * @param {object} [caps=null] - Model capabilities
 * @returns {number} Adjusted max_tokens
 */
export function adjustMaxTokens(body, ceiling = DEFAULT_MAX_TOKENS, caps = null) {
  const rawCap = body.max_completion_tokens || body.max_tokens;
  let maxTokens = rawCap || DEFAULT_MAX_TOKENS;

  // Auto-increase for tool calling to prevent truncated arguments (min never above ceiling)
  if (body.tools && Array.isArray(body.tools) && body.tools.length > 0) {
    const toolFloor = Math.min(DEFAULT_MIN_TOKENS, ceiling);
    if (maxTokens < toolFloor) {
      maxTokens = toolFloor;
    }
  }

  // Dynamic reasoning budget auto-floor:
  // When reasoning is active (reasoning_effort: medium/high/max/ultra or enabled/adaptive thinking),
  // a client setting max_tokens too small (e.g. 1000, 2000) causes the model to spend all tokens
  // on reasoning and terminate with an empty final response.
  // Auto-bump max_tokens up to the reasoning floor (bounded by model ceiling) so the response
  // never runs out of budget during thinking.
  const effort = body.reasoning_effort || body.output_config?.effort;
  const isReasoningEffort = effort && ["medium", "high", "max", "ultra", "xhigh"].includes(effort);
  const isThinkingEnabled = body.thinking?.type === "enabled" || body.thinking?.type === "adaptive" || body.enable_thinking === true || (body.thinking?.budget_tokens && body.thinking.budget_tokens > 0);
  const isReasoningModel = caps?.reasoning === true && effort !== "low" && effort !== "minimal" && effort !== "none";

  if (rawCap && (isReasoningEffort || isThinkingEnabled || isReasoningModel)) {
    const reasoningFloor = Math.min(REASONING_MIN_OUTPUT_FLOOR, ceiling);
    if (maxTokens < reasoningFloor) {
      maxTokens = reasoningFloor;
    }
  }

  // Ensure max_tokens > thinking.budget_tokens (Claude API requirement)
  // Claude API requires strictly greater, so add buffer instead of using the
  // ceiling which could equal budget_tokens when budget_tokens >= ceiling
  if (body.thinking?.budget_tokens && maxTokens <= body.thinking.budget_tokens) {
    maxTokens = Math.min(body.thinking.budget_tokens + 1024, ceiling);
  }

  // Never exceed the ceiling
  if (maxTokens > ceiling) maxTokens = ceiling;

  return maxTokens;
}

/**
 * Newer OpenAI models (gpt-5+, gpt-6+, o1, o3, o4) reject `max_tokens` on Chat
 * Completions with 400 unsupported_parameter ("Use 'max_completion_tokens'
 * instead"). Same match the GitHub executor applies in its transformRequest
 * (open-sse/executors/github.js).
 * @param {string} model - Outbound provider model id
 * @returns {boolean} true when the request must carry max_completion_tokens
 */
export function requiresMaxCompletionTokens(model) {
  return /gpt-[56]|o[134]-/i.test(model);
}

