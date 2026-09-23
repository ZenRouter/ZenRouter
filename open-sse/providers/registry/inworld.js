export default {
  id: "inworld",
  alias: "inworld",
  display: {
    name: "Inworld TTS",
    icon: "record_voice_over",
    color: "#FF6B6B",
    textIcon: "IW",
    website: "https://inworld.ai",
    notice: {
      text: "Free tier available. TTS-1.5 Mini $15/1M chars ($0.015/min), TTS-1.5 Max $25/1M ($0.025/min). Current gen: Realtime TTS-2 (from $25/1M chars). 270+ voices.",
      apiKeyUrl: "https://platform.inworld.ai/api-keys"
    }
  },
  category: "apikey",
  authType: "apikey",
  serviceKinds: [
    "tts"
  ],
  ttsConfig: {
    baseUrl: "https://api.inworld.ai/tts/v1/voice",
    authType: "apikey",
    authHeader: "basic",
    format: "inworld",
    models: [
      {
        id: "inworld-tts-1.5-mini",
        name: "Inworld TTS 1.5 Mini ($0.01/min)"
      },
      {
        id: "inworld-tts-1.5-max",
        name: "Inworld TTS 1.5 Max ($0.025/min)"
      }
    ]
  }
};
