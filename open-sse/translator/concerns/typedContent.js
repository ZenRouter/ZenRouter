import { CLAUDE_BLOCK, OPENAI_BLOCK } from "../schema/index.js";
import { extractReasoningText } from "./reasoning.js";

// Mistral Chat Completions uses text/thinking content lists for both messages
// and deltas. Only normalize that dialect: multimodal/unknown lists stay intact.
export function normalizeTypedContent(holder) {
  if (!holder || !Array.isArray(holder.content) || holder.content.length === 0) return false;
  for (const part of holder.content) {
    if (typeof part === "string") continue;
    if (!part || (part.type !== OPENAI_BLOCK.TEXT && part.type !== CLAUDE_BLOCK.THINKING)) return false;
  }

  const text = [];
  const thinking = [];
  for (const part of holder.content) {
    if (typeof part === "string") text.push(part);
    else if (part.type === OPENAI_BLOCK.TEXT) {
      if (typeof part.text === "string") text.push(part.text);
    } else if (typeof part.thinking === "string") {
      thinking.push(part.thinking);
    } else if (Array.isArray(part.thinking)) {
      for (const inner of part.thinking) {
        if (typeof inner === "string") thinking.push(inner);
        else if (inner?.type === OPENAI_BLOCK.TEXT && typeof inner.text === "string") thinking.push(inner.text);
      }
    }
  }
  holder.content = text.join("");
  if (thinking.length > 0) {
    holder.reasoning_content = extractReasoningText(holder) + thinking.join("");
  }
  return true;
}
