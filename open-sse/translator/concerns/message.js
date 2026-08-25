import { OPENAI_BLOCK } from "../schema/index.js";

// Collapse an OpenAI content-part array: a text-only array becomes a plain
// newline-joined string, otherwise the array is returned as-is. Strict
// OpenAI-compatible upstreams (ollama, llama.cpp, older vLLM) reject content
// arrays even when every block is plain text (#string-safe payloads).
export function collapseTextParts(parts) {
  if (parts.length && parts.every((p) => p?.type === OPENAI_BLOCK.TEXT)) {
    return parts.map((p) => p.text ?? "").join("\n");
  }
  return parts;
}
