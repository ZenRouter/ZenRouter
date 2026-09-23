export default {
  id: "playht",
  alias: "playht",
  display: {
    name: "PlayHT (Discontinued)",
    icon: "play_circle",
    color: "#00B4D8",
    textIcon: "PH",
    website: "https://play.ht",
    notice: {
      text: "PlayAI was acquired by Meta (Jul 2025) and the standalone product is wound down. Kept for existing integrations only.",
      apiKeyUrl: "https://play.ht/studio/api-access"
    },
    deprecated: true,
  },
  category: "apikey",
  authType: "apikey",
  serviceKinds: [
    "tts"
  ],
  ttsConfig: {
    baseUrl: "https://api.play.ht/api/v2/tts/stream",
    authType: "apikey",
    authHeader: "playht",
    format: "playht",
    models: [
      {
        id: "PlayDialog",
        name: "PlayDialog"
      },
      {
        id: "Play3.0-mini",
        name: "Play 3.0 Mini"
      }
    ]
  },
  hidden: true
};
