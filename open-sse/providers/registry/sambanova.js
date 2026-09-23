export default {
  id: "sambanova",
  alias: "samba",
  aliases: ["sambanova-ai"],
  uiAlias: "samba",
  hidden: true,
  display: {
    name: "SambaNova",
    icon: "memory",
    color: "#F97316",
    textIcon: "SN",
    website: "https://sambanova.ai",
    notice: {
      apiKeyUrl: "https://cloud.sambanova.ai/apis",
    },
  },
  category: "apikey",
  authType: "apikey",
  authModes: ["apikey"],
  transport: {
    baseUrl: "https://api.sambanova.ai/v1/chat/completions",
    validateUrl: "https://api.sambanova.ai/v1/models",
  },
  models: [
    { id: "MiniMax-M2.7", name: "MiniMax M2.7", contextLength: 196608 },
    { id: "MiniMax-M3", name: "MiniMax M3 (Preview)", contextLength: 1048576 },
    { id: "DeepSeek-V3.1", name: "DeepSeek V3.1", contextLength: 131072 },
    { id: "DeepSeek-V3.2", name: "DeepSeek V3.2 (Preview)", contextLength: 32768 },
    { id: "Meta-Llama-3.3-70B-Instruct", name: "Llama 3.3 70B", contextLength: 131072 },
    { id: "gpt-oss-120b", name: "GPT OSS 120B", contextLength: 131072 },
    { id: "gemma-4-31B-it", name: "Gemma 4 31B (Preview)", contextLength: 131072 },
  ],
};
