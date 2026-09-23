export default {
  id: "recraft",
  priority: 70,
  alias: "recraft",
  display: {
    name: "Recraft",
    icon: "image",
    color: "#EC4899",
    textIcon: "RC",
    website: "https://recraft.ai",
    notice: {
      apiKeyUrl: "https://www.recraft.ai/profile/api",
    },
  },
  category: "apikey",
  authType: "apikey",
  transport: null,
  models: [
    { id: "recraftv4", name: "Recraft V4", params: ["n","size","style"], kind: "image" },
    { id: "recraftv4_pro", name: "Recraft V4 Pro", params: ["n","size","style"], kind: "image" },
    { id: "recraftv4_vector", name: "Recraft V4 Vector", params: ["n","size","style"], kind: "image" },
    { id: "recraftv4_pro_vector", name: "Recraft V4 Pro Vector", params: ["n","size","style"], kind: "image" },
    { id: "recraftv3", name: "Recraft V3", params: ["n","size","style"], kind: "image" },
    { id: "recraftv2", name: "Recraft V2", params: ["n","size","style"], kind: "image" },
  ],
  serviceKinds: ["image"],
  imageConfig: { baseUrl: "https://external.api.recraft.ai/v1/images/generations" },
};
