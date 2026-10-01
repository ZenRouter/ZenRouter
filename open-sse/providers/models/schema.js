import { deriveModelName } from "./namePatterns.js";

// Normalize version separators in a model id: hyphen between two digits becomes a dot.
// Registry ids use dots for versions ("claude-sonnet-4.5") but clients (CLIs, aliases)
// often send them with dashes ("claude-sonnet-4-5"). Only digit-digit hyphens are
// touched, so word/suffix hyphens stay intact ("-thinking", "-agentic", "qwen3-coder-next").
export function normalizeModelId(modelId) {
  if (typeof modelId !== "string") return modelId;
  return modelId.replace(/(\d)-(\d)/g, "$1.$2");
}

// Model defaults centralized (was scattered as `m.kind || "llm"`, `quotaFamily || "normal"`, etc.)
export const MODEL_DEFAULTS = {
  kind: "llm",
  quotaFamily: "normal",
  strip: [],
  targetFormat: null
};

// Normalize a registry model entry: accept terse "id" string, fill name via regex when omitted.
// Override always wins (raw spread last); name falls back to regex → id.
export function normalizeModel(raw) {
  const model = typeof raw === "string" ? { id: raw } : raw;
  if (model.name !== undefined) return model;
  return { ...model, name: deriveModelName(model.id) };
}

// Resolve model kind with default (accepts legacy `type` field)
export function modelKind(model) {
  return model?.kind || model?.type || inferModelKind(model) || MODEL_DEFAULTS.kind;
}

// Live OpenAI catalogs often omit kind. Use output metadata before conservative
// ID patterns; image *input* alone does not turn a vision chat model into a generator.
export function inferModelKind(model) {
  const outputs = model?.architecture?.output_modalities || model?.output_modalities;
  if (Array.isArray(outputs)) {
    if (outputs.includes("image")) return "image";
    if (outputs.includes("video")) return "video";
    if (outputs.includes("text")) return "llm";
  }
  const id = String(model?.id || "").toLowerCase();
  if (/embed/.test(id)) return "embedding";
  if (/whisper|(?:^|[-_/])asr(?:$|[-_/])|transcri/.test(id)) return "stt";
  if (/(?:^|[-_/])tts(?:$|[-_/])|text-to-speech/.test(id)) return "tts";
  if (/grok-imagine-video|(?:^|\/)sora(?:$|[-.])/.test(id)) return "video";
  if (/grok-(?:imagine-image|2-image)|gpt-image|dall-?e|(?:^|\/)imagen[-\d]|flux[.-]|stable-diffusion|sdxl|seedream|gemini-.*-image/.test(id)) return "image";
  return null;
}
export function modelQuotaFamily(model) {
  return model?.quotaFamily || MODEL_DEFAULTS.quotaFamily;
}
export function modelStrip(model) {
  return model?.strip || [];
}
export function modelTargetFormat(model) {
  return model?.targetFormat || MODEL_DEFAULTS.targetFormat;
}

// Per-model declared upstream formats (e.g. ["openai", "claude"]). Guards the
// sourceFormat-matched transport for multi-endpoint providers whose models differ
// in endpoint support (opencode-go: kimi/glm only do /chat/completions, minimax/qwen
// also do /messages, deepseek also does /responses).
export function modelSupportedFormats(model) {
  return model?.supportedFormats || null;
}
