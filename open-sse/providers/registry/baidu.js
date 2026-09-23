export default {
  id: "baidu",
  alias: "qianfan",
  aliases: ["qianfan", "ernie", "baidu-qianfan"],
  uiAlias: "qianfan",
  category: "apikey",
  authType: "apikey",
  authModes: ["apikey"],
  display: {
    name: "Baidu Qianfan",
    icon: "search",
    color: "#2932E1",
    textIcon: "BD",
    website: "https://cloud.baidu.com/product/qianfan.html",
    notice: {
      apiKeyUrl:
        "https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application",
    },
  },
  transport: {
    baseUrl: "https://qianfan.baidubce.com/v2/chat/completions",
    validateUrl: "https://qianfan.baidubce.com/v2/models",
  },
  models: [
    { id: "ernie-5.1", name: "ERNIE 5.1", contextLength: 131072 },
    { id: "ernie-5.0", name: "ERNIE 5.0", contextLength: 131072 },
    { id: "ernie-4.5-turbo-128k", name: "ERNIE 4.5 Turbo 128K", contextLength: 131072 },
    { id: "ernie-x1.1", name: "ERNIE X1.1", contextLength: 65536 },
    { id: "ernie-x1-turbo-32k", name: "ERNIE X1 Turbo 32K", contextLength: 32768 },
    { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro", contextLength: 1048576 },
    { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", contextLength: 1048576 },
    { id: "glm-5.2", name: "GLM 5.2", contextLength: 202752 },
    { id: "glm-5.1", name: "GLM 5.1", contextLength: 198000 },
    { id: "kimi-k2.6", name: "Kimi K2.6", contextLength: 262144 },
    { id: "qwen3.5-397b-a17b", name: "Qwen 3.5 397B A17B", contextLength: 262144 },
    { id: "qwen3.5-27b", name: "Qwen 3.5 27B", contextLength: 262144 },
  ],
};
