/**
 * Reviewed media additions from primary evidence captured 2026-10-06.
 * Factual shard only; parent resolver integration is separate. Never interpret an
 * empty pricing object as free. Explicit route capability restrictions describe
 * this gateway's tested text-only/basic JSON adapters, not every native feature.
 * Dimensions, characters and UTF-16 code units are not generated token limits.
 * Billing retains native units and qualifiers; no live inference was performed.
 */
export default {
  "openai": {
    "gpt-image-2.5-flare": {
      "capabilities": {
        "tools": false,
        "vision": false,
        "search": false,
        "pdf": false,
        "audioInput": false,
        "videoInput": false,
        "imageOutput": true
      },
      "pricing": {},
      "sources": [
        "https://developers.openai.com/api/docs/models/gpt-image-2.5-flare.md",
        "https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst.md",
        "https://developers.openai.com/api/docs/pricing.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "million_tokens_by_modality",
        "kind": "api",
        "note": "Published native API metadata only; no account entitlement or live inference verified. Non-token and modality-specific rates are not generic token prices.",
        "rates": {
          "text_input": 5,
          "cached_text_input": 1.25,
          "image_input": 8,
          "cached_image_input": 2,
          "image_output": 30
        },
        "unverifiedPriceFields": [
          "input",
          "output",
          "cached",
          "cache_creation"
        ]
      },
      "limits": {
        "kind": "image",
        "scope": "documented-native-api; gateway route restricted to tested request shape",
        "contextScope": "maxInput is an input allowance, not a total context window; dimensions are not generated tokens",
        "authenticatedRouteVerified": false,
        "route": "POST https://api.openai.com/v1/images/generations",
        "routeLimitations": [
          "Do not reuse API image IDs as Codex chat aliases.",
          "Existing Zen adapter is prompt-only; no image edit inputs.",
          "No documented context/output token ceiling on model pages; leave unspecified.",
          "Flat input/output schema cannot represent both text and image input rates."
        ],
        "unverifiedCapabilityFields": [
          "contextWindow",
          "maxOutput",
          "maxInput"
        ]
      }
    },
    "gpt-image-2.5-sunburst": {
      "capabilities": {
        "tools": false,
        "vision": false,
        "search": false,
        "pdf": false,
        "audioInput": false,
        "videoInput": false,
        "imageOutput": true
      },
      "pricing": {},
      "sources": [
        "https://developers.openai.com/api/docs/models/gpt-image-2.5-flare.md",
        "https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst.md",
        "https://developers.openai.com/api/docs/pricing.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "million_tokens_by_modality",
        "kind": "api",
        "note": "Published native API metadata only; no account entitlement or live inference verified. Non-token and modality-specific rates are not generic token prices.",
        "rates": {
          "text_input": 5,
          "cached_text_input": 1.25,
          "image_input": 8,
          "cached_image_input": 2,
          "image_output": 30
        },
        "unverifiedPriceFields": [
          "input",
          "output",
          "cached",
          "cache_creation"
        ]
      },
      "limits": {
        "kind": "image",
        "scope": "documented-native-api; gateway route restricted to tested request shape",
        "contextScope": "maxInput is an input allowance, not a total context window; dimensions are not generated tokens",
        "authenticatedRouteVerified": false,
        "route": "POST https://api.openai.com/v1/images/generations",
        "routeLimitations": [
          "Do not reuse API image IDs as Codex chat aliases.",
          "Existing Zen adapter is prompt-only; no image edit inputs.",
          "No documented context/output token ceiling on model pages; leave unspecified.",
          "Flat input/output schema cannot represent both text and image input rates."
        ],
        "unverifiedCapabilityFields": [
          "contextWindow",
          "maxOutput",
          "maxInput"
        ]
      }
    }
  },
  "gemini": {
    "gemini-embedding-2": {
      "capabilities": {
        "tools": false,
        "vision": false,
        "search": false,
        "pdf": false,
        "audioInput": false,
        "videoInput": false,
        "maxInput": 8192
      },
      "pricing": {
        "input": 0.2
      },
      "sources": [
        "https://ai.google.dev/gemini-api/docs/models/gemini-embedding-2",
        "https://ai.google.dev/gemini-api/docs/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "million_input_text_tokens",
        "kind": "api",
        "note": "Published native API metadata only; no account entitlement or live inference verified. Non-token and modality-specific rates are not generic token prices.",
        "rates": {
          "input": 0.2,
          "output": 0
        },
        "unverifiedPriceFields": [
          "output",
          "cached",
          "cache_creation"
        ]
      },
      "limits": {
        "kind": "embedding",
        "scope": "documented-native-api; gateway route restricted to tested request shape",
        "contextScope": "maxInput is an input allowance, not a total context window; dimensions are not generated tokens",
        "authenticatedRouteVerified": false,
        "route": "POST https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent (array input: batchEmbedContents)",
        "routeLimitations": [
          "Only text/string-array inputs are supported by Zen adapter; structured inputs are String(object).",
          "Do not transfer multimodal capabilities from provider to this route.",
          "Preview ID deprecation page literally says embedding-2-preview; do not silently normalize that into gemini-embedding-2-preview."
        ],
        "unverifiedCapabilityFields": [
          "contextWindow",
          "maxOutput"
        ],
        "maxInput": 8192,
        "dimensions": {
          "min": 128,
          "max": 3072,
          "recommended": [
            768,
            1536,
            3072
          ]
        }
      }
    },
    "gemini-3.1-flash-lite-image": {
      "capabilities": {
        "tools": false,
        "vision": false,
        "search": false,
        "pdf": false,
        "audioInput": false,
        "videoInput": false,
        "imageOutput": true,
        "maxInput": 65536,
        "maxOutput": 4096
      },
      "pricing": {},
      "sources": [
        "https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite-image",
        "https://ai.google.dev/gemini-api/docs/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "million_tokens_by_modality",
        "kind": "api",
        "note": "Published native API metadata only; no account entitlement or live inference verified. Non-token and modality-specific rates are not generic token prices.",
        "rates": {
          "input": 0.25,
          "text_and_thinking_output": 1.5,
          "image_output": 30
        },
        "unverifiedPriceFields": [
          "input",
          "output",
          "cached",
          "cache_creation"
        ]
      },
      "limits": {
        "kind": "image",
        "scope": "documented-native-api; gateway route restricted to tested request shape",
        "contextScope": "maxInput is an input allowance, not a total context window; dimensions are not generated tokens",
        "authenticatedRouteVerified": false,
        "route": "POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-image:generateContent",
        "routeLimitations": [
          "Zen image adapter only forwards text prompt and responseModalities; no edit image, resolution, aspect ratio controls."
        ],
        "unverifiedCapabilityFields": [
          "contextWindow"
        ],
        "maxInput": 65536,
        "maxOutput": 4096
      }
    },
    "gemini-3.8-flash-tts": {
      "capabilities": {
        "tools": false,
        "vision": false,
        "search": false,
        "pdf": false,
        "audioInput": false,
        "videoInput": false,
        "audioOutput": true,
        "maxInput": 8192,
        "maxOutput": 16384
      },
      "pricing": {},
      "sources": [
        "https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash-tts",
        "https://ai.google.dev/gemini-api/docs/speech-generation",
        "https://ai.google.dev/gemini-api/docs/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "million_tokens_by_modality",
        "kind": "api",
        "note": "Published native API metadata only; no account entitlement or live inference verified. Non-token and modality-specific rates are not generic token prices.",
        "rates": {
          "text_input": 0.5,
          "audio_output": 9,
          "cached_input": 0.125,
          "valid_through": "2026-12-31",
          "from_2027_01_01": {
            "text_input": 1,
            "audio_output": 18,
            "cached_input": 0.25
          }
        },
        "unverifiedPriceFields": [
          "input",
          "output",
          "cached",
          "cache_creation"
        ]
      },
      "limits": {
        "kind": "tts",
        "scope": "documented-native-api; gateway route restricted to tested request shape",
        "contextScope": "maxInput is an input allowance, not a total context window; dimensions are not generated tokens",
        "authenticatedRouteVerified": false,
        "route": "POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-tts:generateContent",
        "routeLimitations": [
          "Cache storage is a token-hour rate, not a one-time cache-creation rate.",
          "No new-voice list verified.",
          "Known-model and existing Gemini voice tables synchronized; new voices not verified."
        ],
        "unverifiedCapabilityFields": [
          "contextWindow"
        ],
        "maxInput": 8192,
        "maxOutput": 16384
      }
    },
    "gemini-3.8-flash-lite-tts": {
      "capabilities": {
        "tools": false,
        "vision": false,
        "search": false,
        "pdf": false,
        "audioInput": false,
        "videoInput": false,
        "audioOutput": true,
        "maxInput": 8192,
        "maxOutput": 16384
      },
      "pricing": {},
      "sources": [
        "https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash-lite-tts",
        "https://ai.google.dev/gemini-api/docs/deprecations"
      ],
      "billing": {
        "currency": "USD",
        "unit": "unverified",
        "kind": "api",
        "note": "Price or unit not independently verified; unknown is not free and must not inherit a chat-model fallback.",
        "rates": {},
        "unverifiedPriceFields": [
          "input",
          "output",
          "cached",
          "cache_creation"
        ]
      },
      "limits": {
        "kind": "tts",
        "scope": "documented-native-api; gateway route restricted to tested request shape",
        "contextScope": "maxInput is an input allowance, not a total context window; dimensions are not generated tokens",
        "authenticatedRouteVerified": false,
        "route": "POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-lite-tts:generateContent",
        "routeLimitations": [
          "Current specific price not located in fetched pricing body; leave price unknown.",
          "Known-model and existing Gemini voice tables synchronized; new voices not verified."
        ],
        "unverifiedCapabilityFields": [
          "contextWindow"
        ],
        "maxInput": 8192,
        "maxOutput": 16384
      }
    }
  },
  "voyage-ai": {
    "voyage-code-4": {
      "capabilities": {
        "tools": false,
        "vision": false,
        "search": false,
        "pdf": false,
        "audioInput": false,
        "videoInput": false,
        "maxInput": 32000
      },
      "pricing": {
        "input": 0.12
      },
      "sources": [
        "https://docs.voyageai.com/docs/embeddings.md",
        "https://docs.voyageai.com/docs/pricing.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "million_input_tokens",
        "kind": "api",
        "note": "Published native API metadata only; no account entitlement or live inference verified. Non-token and modality-specific rates are not generic token prices.",
        "rates": {
          "input": 0.12,
          "output": 0
        },
        "unverifiedPriceFields": [
          "output",
          "cached",
          "cache_creation"
        ]
      },
      "limits": {
        "kind": "embedding",
        "scope": "documented-native-api; gateway route restricted to tested request shape",
        "contextScope": "maxInput is an input allowance, not a total context window; dimensions are not generated tokens",
        "authenticatedRouteVerified": false,
        "route": "POST https://api.voyageai.com/v1/embeddings",
        "routeLimitations": [
          "Zen sends dimensions, not Voyage output_dimension; configurable dimensions/input_type need adapter mapping.",
          "Do not add voyage-context-4 or multimodal/rerank siblings through ordinary /embeddings without endpoint-specific support."
        ],
        "unverifiedCapabilityFields": [
          "contextWindow",
          "maxOutput"
        ],
        "maxInput": 32000,
        "dimensions": {
          "default": 1024,
          "choices": [
            256,
            512,
            1024,
            2048
          ]
        }
      }
    }
  },
  "mistral": {
    "codestral-embed-2505": {
      "capabilities": {
        "tools": false,
        "vision": false,
        "search": false,
        "pdf": false,
        "audioInput": false,
        "videoInput": false
      },
      "pricing": {
        "input": 0.15
      },
      "sources": [
        "https://docs.mistral.ai/models/codestral-embed-25-05"
      ],
      "billing": {
        "currency": "USD",
        "unit": "million_input_tokens",
        "kind": "api",
        "note": "Published native API metadata only; no account entitlement or live inference verified. Non-token and modality-specific rates are not generic token prices.",
        "rates": {
          "input": 0.15,
          "output": 0
        },
        "unverifiedPriceFields": [
          "output",
          "cached",
          "cache_creation"
        ]
      },
      "limits": {
        "kind": "embedding",
        "scope": "documented-native-api; gateway route restricted to tested request shape",
        "contextScope": "maxInput is an input allowance, not a total context window; dimensions are not generated tokens",
        "authenticatedRouteVerified": false,
        "route": "POST https://api.mistral.ai/v1/embeddings",
        "routeLimitations": [
          "Official retrieved page gives 8k; do not round it to an exact unverified integer.",
          "Alias codestral-embed may exist but this report verifies snapshot literal codestral-embed-2505."
        ],
        "unverifiedCapabilityFields": [
          "contextWindow",
          "maxOutput",
          "maxInput"
        ],
        "providerContextLabel": "8k"
      }
    }
  },
  "fireworks": {
    "fireworks/qwen3-embedding-8b": {
      "capabilities": {
        "tools": false,
        "vision": false,
        "search": false,
        "pdf": false,
        "audioInput": false,
        "videoInput": false
      },
      "pricing": {
        "input": 0.1
      },
      "sources": [
        "https://docs.fireworks.ai/guides/querying-embeddings-models.md",
        "https://docs.fireworks.ai/serverless/pricing.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "million_input_tokens",
        "kind": "api",
        "note": "Published native API metadata only; no account entitlement or live inference verified. Non-token and modality-specific rates are not generic token prices.",
        "rates": {
          "input": 0.1,
          "output": 0
        },
        "unverifiedPriceFields": [
          "output",
          "cached",
          "cache_creation"
        ]
      },
      "limits": {
        "kind": "embedding",
        "scope": "documented-native-api; gateway route restricted to tested request shape",
        "contextScope": "maxInput is an input allowance, not a total context window; dimensions are not generated tokens",
        "authenticatedRouteVerified": false,
        "route": "POST https://api.fireworks.ai/inference/v1/embeddings",
        "routeLimitations": [
          "Exact route is fireworks/qwen3-embedding-8b, not automatically accounts/fireworks/models/...",
          "4B and 0.6B are dedicated-only per docs, not serverless static additions.",
          "Existing nomic-ai/nomic-embed-text-v1.5 remains explicitly supported legacy; do not remove it for lacking library page."
        ],
        "unverifiedCapabilityFields": [
          "contextWindow",
          "maxOutput",
          "maxInput"
        ],
        "providerContextLabel": "40k"
      }
    }
  },
  "jina-ai": {
    "jina-embeddings-v5-text-small": {
      "capabilities": {
        "tools": false,
        "vision": false,
        "search": false,
        "pdf": false,
        "audioInput": false,
        "videoInput": false,
        "maxInput": 32768
      },
      "pricing": {},
      "sources": [
        "https://jina.ai/embeddings",
        "https://docs.jina.ai",
        "https://api.jina.ai/v1/models"
      ],
      "billing": {
        "currency": "USD",
        "unit": "unverified",
        "kind": "api",
        "note": "Price or unit not independently verified; unknown is not free and must not inherit a chat-model fallback.",
        "rates": {},
        "unverifiedPriceFields": [
          "input",
          "output",
          "cached",
          "cache_creation"
        ]
      },
      "limits": {
        "kind": "embedding",
        "scope": "documented-native-api; gateway route restricted to tested request shape",
        "contextScope": "maxInput is an input allowance, not a total context window; dimensions are not generated tokens",
        "authenticatedRouteVerified": false,
        "route": "POST https://api.jina.ai/v1/embeddings",
        "routeLimitations": [
          "Docs use unprefixed model ID; public /v1/models uses jina-ai/ prefix. Preserve this distinction.",
          "Raw public pricing.prompt is 0.00000005 small / 0.00000002 nano; do not assert USD/M mapping without unit provenance.",
          "Zen only passes input/encoding_format/dimensions, not task or multimodal options.",
          "New v5 entries explicitly declared in registry.models and embeddingConfig.models; no general nested model merge."
        ],
        "unverifiedCapabilityFields": [
          "contextWindow",
          "maxOutput"
        ],
        "maxInput": 32768,
        "dimensions": 1024
      }
    },
    "jina-embeddings-v5-text-nano": {
      "capabilities": {
        "tools": false,
        "vision": false,
        "search": false,
        "pdf": false,
        "audioInput": false,
        "videoInput": false,
        "maxInput": 8192
      },
      "pricing": {},
      "sources": [
        "https://jina.ai/embeddings",
        "https://docs.jina.ai",
        "https://api.jina.ai/v1/models"
      ],
      "billing": {
        "currency": "USD",
        "unit": "unverified",
        "kind": "api",
        "note": "Price or unit not independently verified; unknown is not free and must not inherit a chat-model fallback.",
        "rates": {},
        "unverifiedPriceFields": [
          "input",
          "output",
          "cached",
          "cache_creation"
        ]
      },
      "limits": {
        "kind": "embedding",
        "scope": "documented-native-api; gateway route restricted to tested request shape",
        "contextScope": "maxInput is an input allowance, not a total context window; dimensions are not generated tokens",
        "authenticatedRouteVerified": false,
        "route": "POST https://api.jina.ai/v1/embeddings",
        "routeLimitations": [
          "Docs use unprefixed model ID; public /v1/models uses jina-ai/ prefix. Preserve this distinction.",
          "Raw public pricing.prompt is 0.00000005 small / 0.00000002 nano; do not assert USD/M mapping without unit provenance.",
          "Zen only passes input/encoding_format/dimensions, not task or multimodal options.",
          "New v5 entries explicitly declared in registry.models and embeddingConfig.models; no general nested model merge."
        ],
        "unverifiedCapabilityFields": [
          "contextWindow",
          "maxOutput"
        ],
        "maxInput": 8192,
        "dimensions": 768
      }
    }
  },
  "elevenlabs": {
    "eleven_v4": {
      "capabilities": {
        "tools": false,
        "vision": false,
        "search": false,
        "pdf": false,
        "audioInput": false,
        "videoInput": false,
        "audioOutput": true
      },
      "pricing": {},
      "sources": [
        "https://elevenlabs.io/docs/overview/models.md",
        "https://elevenlabs.io/docs/api-reference/text-to-speech/convert",
        "https://elevenlabs.io/pricing/api"
      ],
      "billing": {
        "currency": "USD",
        "unit": "subscription_credits_per_character",
        "kind": "subscription",
        "note": "Subscription credits and promotional character multipliers; no flat USD/token or stable USD/character rate verified.",
        "rates": {},
        "unverifiedPriceFields": [
          "input",
          "output",
          "cached",
          "cache_creation"
        ]
      },
      "limits": {
        "kind": "tts",
        "scope": "documented-native-api; gateway route restricted to tested request shape",
        "contextScope": "maxInput is an input allowance, not a total context window; dimensions are not generated tokens",
        "authenticatedRouteVerified": false,
        "route": "POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}; body.model_id exact",
        "routeLimitations": [
          "Public ID invocation needs <model>/<voice_id>; bare model is treated as a voice by current adapter.",
          "Subscription credits/character multipliers and promotion through Oct 12: not a flat USD/token rate.",
          "New IDs synchronized in registry.models, ttsConfig.models and selector; model/voice invocation remains required."
        ],
        "unverifiedCapabilityFields": [
          "contextWindow",
          "maxOutput",
          "maxInput"
        ],
        "characters": 10000
      }
    },
    "eleven_v4_turbo": {
      "capabilities": {
        "tools": false,
        "vision": false,
        "search": false,
        "pdf": false,
        "audioInput": false,
        "videoInput": false,
        "audioOutput": true
      },
      "pricing": {},
      "sources": [
        "https://elevenlabs.io/docs/overview/models.md",
        "https://elevenlabs.io/docs/api-reference/text-to-speech/convert",
        "https://elevenlabs.io/pricing/api"
      ],
      "billing": {
        "currency": "USD",
        "unit": "subscription_credits_per_character",
        "kind": "subscription",
        "note": "Subscription credits and promotional character multipliers; no flat USD/token or stable USD/character rate verified.",
        "rates": {},
        "unverifiedPriceFields": [
          "input",
          "output",
          "cached",
          "cache_creation"
        ]
      },
      "limits": {
        "kind": "tts",
        "scope": "documented-native-api; gateway route restricted to tested request shape",
        "contextScope": "maxInput is an input allowance, not a total context window; dimensions are not generated tokens",
        "authenticatedRouteVerified": false,
        "route": "POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}; body.model_id exact",
        "routeLimitations": [
          "Public ID invocation needs <model>/<voice_id>; bare model is treated as a voice by current adapter.",
          "Subscription credits/character multipliers and promotion through Oct 12: not a flat USD/token rate.",
          "New IDs synchronized in registry.models, ttsConfig.models and selector; model/voice invocation remains required."
        ],
        "unverifiedCapabilityFields": [
          "contextWindow",
          "maxOutput",
          "maxInput"
        ]
      }
    }
  },
  "inworld": {
    "inworld-tts-2": {
      "capabilities": {
        "tools": false,
        "vision": false,
        "search": false,
        "pdf": false,
        "audioInput": false,
        "videoInput": false,
        "audioOutput": true
      },
      "pricing": {},
      "sources": [
        "https://docs.inworld.ai/tts/tts-models",
        "https://docs.inworld.ai/api-reference/ttsAPI/texttospeech/synthesize-speech",
        "https://docs.inworld.ai/portal/billing",
        "https://inworld.ai/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "million_characters",
        "kind": "api-on-demand",
        "note": "On-demand USD per million characters; paid-plan prices differ. Request limit is UTF-16 code units, not billing tokens.",
        "rates": {
          "rate": 25
        },
        "unverifiedPriceFields": [
          "input",
          "output",
          "cached",
          "cache_creation"
        ]
      },
      "limits": {
        "kind": "tts",
        "scope": "documented-native-api; gateway route restricted to tested request shape",
        "contextScope": "maxInput is an input allowance, not a total context window; dimensions are not generated tokens",
        "authenticatedRouteVerified": false,
        "route": "POST https://api.inworld.ai/tts/v1/voice; body.modelId exact",
        "routeLimitations": [
          "Source 1.5-mini/max are deprecated; display names embed old per-minute estimates.",
          "On-demand TTS-2 is $25/M characters and Flash $15/M characters; paid tiers differ.",
          "Explicit registry and selector entries now supply known model IDs; explicit voice is recommended."
        ],
        "unverifiedCapabilityFields": [
          "contextWindow",
          "maxOutput",
          "maxInput"
        ],
        "utf16CodeUnits": 2000
      }
    },
    "inworld-tts-2-flash": {
      "capabilities": {
        "tools": false,
        "vision": false,
        "search": false,
        "pdf": false,
        "audioInput": false,
        "videoInput": false,
        "audioOutput": true
      },
      "pricing": {},
      "sources": [
        "https://docs.inworld.ai/tts/tts-models",
        "https://docs.inworld.ai/api-reference/ttsAPI/texttospeech/synthesize-speech",
        "https://docs.inworld.ai/portal/billing",
        "https://inworld.ai/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "million_characters",
        "kind": "api-on-demand",
        "note": "On-demand USD per million characters; paid-plan prices differ. Request limit is UTF-16 code units, not billing tokens.",
        "rates": {
          "rate": 15
        },
        "unverifiedPriceFields": [
          "input",
          "output",
          "cached",
          "cache_creation"
        ]
      },
      "limits": {
        "kind": "tts",
        "scope": "documented-native-api; gateway route restricted to tested request shape",
        "contextScope": "maxInput is an input allowance, not a total context window; dimensions are not generated tokens",
        "authenticatedRouteVerified": false,
        "route": "POST https://api.inworld.ai/tts/v1/voice; body.modelId exact",
        "routeLimitations": [
          "Source 1.5-mini/max are deprecated; display names embed old per-minute estimates.",
          "On-demand TTS-2 is $25/M characters and Flash $15/M characters; paid tiers differ.",
          "Explicit registry and selector entries now supply known model IDs; explicit voice is recommended."
        ],
        "unverifiedCapabilityFields": [
          "contextWindow",
          "maxOutput",
          "maxInput"
        ],
        "utf16CodeUnits": 2000
      }
    }
  },
  "recraft": {
    "recraftv4_1_flash": {
      "capabilities": {
        "tools": false,
        "vision": false,
        "search": false,
        "pdf": false,
        "audioInput": false,
        "videoInput": false,
        "imageOutput": true
      },
      "pricing": {},
      "sources": [
        "https://www.recraft.ai/docs/api-reference/models/recraft-v4-1-flash",
        "https://www.recraft.ai/docs/api-reference/models/recraft-v4-1",
        "https://www.recraft.ai/docs/api-reference/endpoints",
        "https://www.recraft.ai/docs/api-reference/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "image",
        "kind": "api",
        "note": "Published native API metadata only; no account entitlement or live inference verified. Non-token and modality-specific rates are not generic token prices.",
        "rates": {
          "rate": 0.007
        },
        "unverifiedPriceFields": [
          "input",
          "output",
          "cached",
          "cache_creation"
        ]
      },
      "limits": {
        "kind": "image",
        "scope": "documented-native-api; gateway route restricted to tested request shape",
        "contextScope": "maxInput is an input allowance, not a total context window; dimensions are not generated tokens",
        "authenticatedRouteVerified": false,
        "route": "POST https://external.api.recraft.ai/v1/images/generations",
        "routeLimitations": [
          "Use default JSON/url output; multipart preview/streaming not supported by generic Zen adapter.",
          "No token context/output limit should be invented."
        ],
        "unverifiedCapabilityFields": [
          "contextWindow",
          "maxOutput",
          "maxInput"
        ]
      }
    },
    "recraftv4_1": {
      "capabilities": {
        "tools": false,
        "vision": false,
        "search": false,
        "pdf": false,
        "audioInput": false,
        "videoInput": false,
        "imageOutput": true
      },
      "pricing": {},
      "sources": [
        "https://www.recraft.ai/docs/api-reference/models/recraft-v4-1-flash",
        "https://www.recraft.ai/docs/api-reference/models/recraft-v4-1",
        "https://www.recraft.ai/docs/api-reference/endpoints",
        "https://www.recraft.ai/docs/api-reference/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "image",
        "kind": "api",
        "note": "Published native API metadata only; no account entitlement or live inference verified. Non-token and modality-specific rates are not generic token prices.",
        "rates": {
          "rate": 0.035
        },
        "unverifiedPriceFields": [
          "input",
          "output",
          "cached",
          "cache_creation"
        ]
      },
      "limits": {
        "kind": "image",
        "scope": "documented-native-api; gateway route restricted to tested request shape",
        "contextScope": "maxInput is an input allowance, not a total context window; dimensions are not generated tokens",
        "authenticatedRouteVerified": false,
        "route": "POST https://external.api.recraft.ai/v1/images/generations",
        "routeLimitations": [
          "Use default JSON/url output; multipart preview/streaming not supported by generic Zen adapter.",
          "No token context/output limit should be invented."
        ],
        "unverifiedCapabilityFields": [
          "contextWindow",
          "maxOutput",
          "maxInput"
        ]
      }
    },
    "recraftv4_1_vector": {
      "capabilities": {
        "tools": false,
        "vision": false,
        "search": false,
        "pdf": false,
        "audioInput": false,
        "videoInput": false,
        "imageOutput": true
      },
      "pricing": {},
      "sources": [
        "https://www.recraft.ai/docs/api-reference/models/recraft-v4-1-flash",
        "https://www.recraft.ai/docs/api-reference/models/recraft-v4-1",
        "https://www.recraft.ai/docs/api-reference/endpoints",
        "https://www.recraft.ai/docs/api-reference/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "image",
        "kind": "api",
        "note": "Published native API metadata only; no account entitlement or live inference verified. Non-token and modality-specific rates are not generic token prices.",
        "rates": {
          "rate": 0.08
        },
        "unverifiedPriceFields": [
          "input",
          "output",
          "cached",
          "cache_creation"
        ]
      },
      "limits": {
        "kind": "image",
        "scope": "documented-native-api; gateway route restricted to tested request shape",
        "contextScope": "maxInput is an input allowance, not a total context window; dimensions are not generated tokens",
        "authenticatedRouteVerified": false,
        "route": "POST https://external.api.recraft.ai/v1/images/generations",
        "routeLimitations": [
          "Use default JSON/url output; multipart preview/streaming not supported by generic Zen adapter.",
          "No token context/output limit should be invented."
        ],
        "unverifiedCapabilityFields": [
          "contextWindow",
          "maxOutput",
          "maxInput"
        ]
      }
    },
    "recraftv4_1_pro": {
      "capabilities": {
        "tools": false,
        "vision": false,
        "search": false,
        "pdf": false,
        "audioInput": false,
        "videoInput": false,
        "imageOutput": true
      },
      "pricing": {},
      "sources": [
        "https://www.recraft.ai/docs/api-reference/models/recraft-v4-1-flash",
        "https://www.recraft.ai/docs/api-reference/models/recraft-v4-1",
        "https://www.recraft.ai/docs/api-reference/endpoints",
        "https://www.recraft.ai/docs/api-reference/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "image",
        "kind": "api",
        "note": "Published native API metadata only; no account entitlement or live inference verified. Non-token and modality-specific rates are not generic token prices.",
        "rates": {
          "rate": 0.21
        },
        "unverifiedPriceFields": [
          "input",
          "output",
          "cached",
          "cache_creation"
        ]
      },
      "limits": {
        "kind": "image",
        "scope": "documented-native-api; gateway route restricted to tested request shape",
        "contextScope": "maxInput is an input allowance, not a total context window; dimensions are not generated tokens",
        "authenticatedRouteVerified": false,
        "route": "POST https://external.api.recraft.ai/v1/images/generations",
        "routeLimitations": [
          "Use default JSON/url output; multipart preview/streaming not supported by generic Zen adapter.",
          "No token context/output limit should be invented."
        ],
        "unverifiedCapabilityFields": [
          "contextWindow",
          "maxOutput",
          "maxInput"
        ]
      }
    },
    "recraftv4_1_pro_vector": {
      "capabilities": {
        "tools": false,
        "vision": false,
        "search": false,
        "pdf": false,
        "audioInput": false,
        "videoInput": false,
        "imageOutput": true
      },
      "pricing": {},
      "sources": [
        "https://www.recraft.ai/docs/api-reference/models/recraft-v4-1-flash",
        "https://www.recraft.ai/docs/api-reference/models/recraft-v4-1",
        "https://www.recraft.ai/docs/api-reference/endpoints",
        "https://www.recraft.ai/docs/api-reference/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "image",
        "kind": "api",
        "note": "Published native API metadata only; no account entitlement or live inference verified. Non-token and modality-specific rates are not generic token prices.",
        "rates": {
          "rate": 0.3
        },
        "unverifiedPriceFields": [
          "input",
          "output",
          "cached",
          "cache_creation"
        ]
      },
      "limits": {
        "kind": "image",
        "scope": "documented-native-api; gateway route restricted to tested request shape",
        "contextScope": "maxInput is an input allowance, not a total context window; dimensions are not generated tokens",
        "authenticatedRouteVerified": false,
        "route": "POST https://external.api.recraft.ai/v1/images/generations",
        "routeLimitations": [
          "Use default JSON/url output; multipart preview/streaming not supported by generic Zen adapter.",
          "No token context/output limit should be invented."
        ],
        "unverifiedCapabilityFields": [
          "contextWindow",
          "maxOutput",
          "maxInput"
        ]
      }
    }
  }
};
