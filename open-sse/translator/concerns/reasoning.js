import { ROLE, REASONING_DETAIL } from "../schema/index.js";

// Build OpenAI delta carrying reasoning_content (optional leading assistant role)
export function reasoningDelta(text, withRole = false) {
  return withRole
    ? { role: ROLE.ASSISTANT, reasoning_content: text }
    : { reasoning_content: text };
}

// Extract reasoning text from a streamed OpenAI-compatible delta across vendor shapes:
//   - reasoning_content (GLM, Qwen, DeepSeek, Kimi, Step, Hunyuan)
//   - reasoning (some compat layers)
//   - reasoning_details[] (MiniMax reasoning_split=true): [{ text|content }]
// Returns concatenated reasoning string, or "" when none.
export function extractReasoningText(delta) {
  if (!delta || typeof delta !== "object") return "";
  if (typeof delta.reasoning_content === "string" && delta.reasoning_content) return delta.reasoning_content;
  if (typeof delta.reasoning === "string" && delta.reasoning) return delta.reasoning;
  const details = delta.reasoning_details;
  if (Array.isArray(details)) {
    const parts = [];
    for (const detail of details) {
      if (typeof detail === "string") {
        parts.push(detail);
        continue;
      }
      if (!detail || typeof detail !== "object") continue;
      // Typed opaque continuity is not readable reasoning, even if a vendor
      // attaches a text-like field. Untyped entries are MiniMax's split shape.
      if (detail.type != null && detail.type !== REASONING_DETAIL.TEXT && detail.type !== REASONING_DETAIL.SUMMARY) continue;
      const text = typeof detail.text === "string" && detail.text
        ? detail.text
        : typeof detail.content === "string" ? detail.content : "";
      if (text) parts.push(text);
    }
    return parts.join("");
  }
  return "";
}
