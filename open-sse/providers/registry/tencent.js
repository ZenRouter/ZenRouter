export default {
  id: "tencent",
  alias: "hunyuan",
  aliases: ["hunyuan", "tencent-hunyuan"],
  uiAlias: "hunyuan",
  display: {
    name: "Tencent Hunyuan",
    icon: "cloud",
    color: "#0052D9",
    textIcon: "HY",
    website: "https://cloud.tencent.com/product/hunyuan",
    notice: {
      apiKeyUrl: "https://console.cloud.tencent.com/hunyuan/api-key",
    },
  },
  category: "apikey",
  authType: "apikey",
  authModes: ["apikey"],
  transport: {
    baseUrl: "https://api.hunyuan.cloud.tencent.com/v1/chat/completions",
    validateUrl: "https://api.hunyuan.cloud.tencent.com/v1/models",
  },
  models: [
    { id: "hy3-preview", name: "Hunyuan Hy3 Preview", contextLength: 262144 },
    { id: "hunyuan-turbos-latest", name: "Hunyuan TurboS Latest (Legacy)", contextLength: 200000 },
    { id: "hunyuan-t1-latest", name: "Hunyuan T1 Latest (Legacy)", contextLength: 256000 },
  ],
};
