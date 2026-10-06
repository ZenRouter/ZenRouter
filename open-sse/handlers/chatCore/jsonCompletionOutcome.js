import { FORMATS } from "../../translator/formats.js";
import { ROLE, RESPONSES_ITEM } from "../../translator/schema/index.js";
import { extractReasoningText } from "../../translator/concerns/reasoning.js";
import { createErrorResult } from "../../utils/error.js";
import { HTTP_STATUS } from "../../config/runtimeConfig.js";

// Reasoning alone is not a usable answer; genuine partial output must survive.
export function isTruncatedEmptyCompletion(responseBody) {
  if (!responseBody || typeof responseBody !== "object") return false;

  let truncated = false;
  let usable = false;

  // OpenAI Chat shape
  const choice = responseBody?.choices?.[0];
  if (choice) {
    if (choice.finish_reason === "length") truncated = true;
    const msg = choice.message || {};
    if (typeof msg.content === "string" && msg.content.length > 0) usable = true;
    if (Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) usable = true;
    if (typeof msg.refusal === "string" && msg.refusal.length > 0) usable = true;
  }

  // OpenAI Responses shape
  if (responseBody?.object === "response") {
    if (responseBody.status === "incomplete" &&
        (!responseBody.incomplete_details?.reason || responseBody.incomplete_details.reason === "max_output_tokens")) {
      truncated = true;
    }
    for (const item of responseBody.output || []) {
      if (item?.type === "function_call" || item?.type === "custom_tool_call") { usable = true; break; }
      for (const part of item?.content || []) {
        if ((part?.type === "output_text" && typeof part.text === "string" && part.text.length > 0) || (part?.type === "refusal" && typeof part.refusal === "string" && part.refusal.length > 0)) { usable = true; break; }
      }
      if (usable) break;
    }
  }

  // Claude Messages shape
  if (responseBody?.type === "message" && Array.isArray(responseBody?.content)) {
    if (responseBody.stop_reason === "max_tokens") truncated = true;
    for (const block of responseBody.content) {
      if ((block?.type === "text" && block?.text) || block?.type === "tool_use") { usable = true; break; }
    }
  }

  // Gemini OAuth endpoints wrap the native generation response.
  const gemini = responseBody.response || responseBody;
  const candidate = gemini.candidates?.[0];
  if (candidate) {
    if (candidate.finishReason === "MAX_TOKENS") truncated = true;
    for (const part of candidate.content?.parts || []) {
      if (part.thought === true) continue;
      if (part.text || part.functionCall || part.inlineData || part.inline_data) { usable = true; break; }
    }
  }
  return truncated && !usable;
}

function extractCustomToolInput(argumentsValue) {
  const argumentsText = typeof argumentsValue === "string" ? argumentsValue : JSON.stringify(argumentsValue || {});
  try {
    const parsed = JSON.parse(argumentsText);
    if (parsed && typeof parsed === "object" && typeof parsed.input === "string") return parsed.input;
  } catch { /* raw freeform input */ }
  return argumentsText;
}

export function openAICompletionToResponses(responseBody, customToolNames = null) {
  const choice = responseBody?.choices?.[0];
  if (!choice) return responseBody;

  const message = choice.message || {};
  const output = [];

  // Reasoning → a reasoning item (summary text), mirroring the streaming path.
  const reasoning = extractReasoningText(message);
  if (typeof reasoning === "string" && reasoning.length > 0) {
    output.push({
      type: RESPONSES_ITEM.REASONING,
      status: "completed",
      summary: [{ type: RESPONSES_ITEM.SUMMARY_TEXT, text: reasoning }],
    });
  }

  // Assistant text → a message item with output_text content.
  const text = typeof message.content === "string" ? message.content : "";
  if (text.length > 0) {
    output.push({
      type: RESPONSES_ITEM.MESSAGE,
      status: "completed",
      role: ROLE.ASSISTANT,
      content: [{ type: RESPONSES_ITEM.OUTPUT_TEXT, text, annotations: [] }],
    });
  }

  if (typeof message.refusal === "string" && message.refusal.length > 0) {
    output.push({ type: RESPONSES_ITEM.MESSAGE, status: "completed", role: ROLE.ASSISTANT,
      content: [{ type: "refusal", refusal: message.refusal }] });
  }

  // tool_calls → function_call/custom_tool_call items (Responses-native tool shape).
  for (const tc of message.tool_calls || []) {
    const fn = tc.function || {};
    const custom = customToolNames?.has(fn.name);
    output.push({
      type: custom ? RESPONSES_ITEM.CUSTOM_TOOL_CALL : RESPONSES_ITEM.FUNCTION_CALL,
      status: "completed",
      id: `${custom ? "ctc" : "fc"}_${tc.id || ""}`,
      call_id: tc.id || "",
      name: fn.name || "",
      ...(custom
        ? { input: extractCustomToolInput(fn.arguments) }
        : { arguments: typeof fn.arguments === "string" ? fn.arguments : JSON.stringify(fn.arguments || {}) }),
    });
  }

  const usage = responseBody.usage || {};
  const truncated = ["length", "max_tokens"].includes(choice.finish_reason);
  const status = truncated ? "incomplete" : "completed";

  return {
    id: `resp_${responseBody.id || ""}`.replace(/^resp_chatcmpl-/, "resp_"),
    object: "response",
    created_at: responseBody.created || Math.floor(Date.now() / 1000),
    model: responseBody.model || "unknown",
    status,
    ...(truncated ? { incomplete_details: { reason: "max_output_tokens" } } : {}),
    background: false,
    error: null,
    output,
    usage: {
      input_tokens: usage.prompt_tokens || usage.input_tokens || 0,
      output_tokens: usage.completion_tokens || usage.output_tokens || 0,
      total_tokens: usage.total_tokens ?? (usage.prompt_tokens ?? usage.input_tokens ?? 0) + (usage.completion_tokens ?? usage.output_tokens ?? 0),
      ...(usage.prompt_tokens_details ? { input_tokens_details: usage.prompt_tokens_details } : {}),
      ...(usage.completion_tokens_details ? { output_tokens_details: usage.completion_tokens_details } : {}),
      ...(usage.estimated ? { estimated: true } : {}),
    },
  };
}

export function outputBudgetError(responseBody, sourceFormat, body = {}) {
  if (!isTruncatedEmptyCompletion(responseBody)) return null;
  const gemini = [FORMATS.GEMINI, FORMATS.GEMINI_CLI, FORMATS.ANTIGRAVITY, FORMATS.VERTEX].includes(sourceFormat);
  const param = sourceFormat === FORMATS.OPENAI_RESPONSES ? "max_output_tokens"
    : gemini ? "generationConfig.maxOutputTokens"
      : body.max_completion_tokens !== undefined ? "max_completion_tokens" : "max_tokens";
  return createErrorResult(HTTP_STATUS.BAD_REQUEST,
    `Output budget exhausted before any text or tool calls; increase ${param} or reduce reasoning effort`,
    undefined, { type: "invalid_request_error", code: "output_budget_exhausted", param });
}
