export default {
  id: "huggingface",
  priority: 70,
  hasFree: true,
  alias: "huggingface",
  aliases: [
    "hf",
  ],
  uiAlias: "hf",
  display: {
    name: "HuggingFace",
    icon: "face",
    color: "#FFD21E",
    textIcon: "HF",
    website: "https://huggingface.co",
    notice: {
      apiKeyUrl: "https://huggingface.co/settings/tokens",
    },
  },
  category: "apikey",
  authType: "apikey",
  hiddenKinds: [
    "tts",
  ],
  transport: null,
  models: [
    { id: "black-forest-labs/FLUX.1-schnell", name: "FLUX.1 Schnell", params: [], kind: "image" },
    { id: "stabilityai/stable-diffusion-xl-base-1.0", name: "SDXL Base 1.0", params: [], kind: "image" },
    { id: "openai/whisper-large-v3", name: "Whisper Large v3 (HF)", params: ["language"], kind: "stt" },
    { id: "openai/whisper-small", name: "Whisper Small (HF)", params: ["language"], kind: "stt" },
  ],
  serviceKinds: ["image", "stt"],
  // Legacy api-inference.huggingface.co retired; Inference Providers router keeps
  // the /hf-inference/models/{repo} path shape (same {inputs} body).
  imageConfig: { baseUrl: "https://router.huggingface.co/hf-inference/models" },
};
