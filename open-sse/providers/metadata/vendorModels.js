// Provider-scoped official-source facts reviewed 2026-10-06.
// Missing fields are unverified, not false/zero. Billing notes preserve unsupported tariffs.
// Resolver integration is deliberately separate from this dependency-free literal shard.
export default {
  "deepseek": {
    "deepseek-flash": {
      "capabilities": {
        "vision": true,
        "tools": true,
        "reasoning": true,
        "thinkingCanDisable": true
      },
      "pricing": {
        "input": 0.15,
        "output": 0.6,
        "cached": 0.003
      },
      "sources": [
        "https://api-docs.deepseek.com/quick_start/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "time-dependent-payg",
        "note": "Off-peak USD/1M token rates shown. Peak Monday-Friday 01:00-04:00 and 06:00-10:00 UTC: input 0.3, output 1.2, cached 0.006. Official limits are 1M context / 384K output; exact notation conversion deferred. No separate cache-creation fee verified."
      }
    },
    "deepseek-v4-flash": {
      "capabilities": {
        "vision": true,
        "tools": true,
        "reasoning": true,
        "thinkingCanDisable": true
      },
      "pricing": {
        "input": 0.15,
        "output": 0.6,
        "cached": 0.003
      },
      "sources": [
        "https://api-docs.deepseek.com/quick_start/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "time-dependent-payg",
        "note": "Off-peak USD/1M token rates shown. Peak Monday-Friday 01:00-04:00 and 06:00-10:00 UTC: input 0.3, output 1.2, cached 0.006. Official limits are 1M context / 384K output; exact notation conversion deferred. No separate cache-creation fee verified."
      }
    },
    "deepseek-v4-flash-vision-exp": {
      "capabilities": {
        "vision": true,
        "tools": true,
        "reasoning": true,
        "thinkingCanDisable": true
      },
      "pricing": {
        "input": 0.15,
        "output": 0.6,
        "cached": 0.003
      },
      "sources": [
        "https://api-docs.deepseek.com/quick_start/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "time-dependent-payg",
        "note": "Off-peak USD/1M token rates shown. Peak Monday-Friday 01:00-04:00 and 06:00-10:00 UTC: input 0.3, output 1.2, cached 0.006. Official limits are 1M context / 384K output; exact notation conversion deferred. No separate cache-creation fee verified."
      }
    },
    "deepseek-v4-pro": {
      "capabilities": {
        "vision": false,
        "tools": true,
        "reasoning": true,
        "thinkingCanDisable": true
      },
      "pricing": {
        "input": 0.66,
        "output": 1.98,
        "cached": 0.022
      },
      "sources": [
        "https://api-docs.deepseek.com/quick_start/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "time-dependent-payg",
        "note": "Off-peak USD/1M token rates shown. Peak Monday-Friday 01:00-04:00 and 06:00-10:00 UTC: input 1.32, output 3.96, cached 0.044. Official limits are 1M context / 384K output; exact notation conversion deferred. No separate cache-creation fee verified."
      }
    },
    "deepseek-v4-pro-max": {
      "capabilities": {
        "vision": false,
        "tools": true,
        "reasoning": true,
        "thinkingCanDisable": true
      },
      "pricing": {
        "input": 0.66,
        "output": 1.98,
        "cached": 0.022
      },
      "sources": [
        "https://api-docs.deepseek.com/quick_start/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "time-dependent-payg",
        "note": "Off-peak USD/1M token rates shown. Peak Monday-Friday 01:00-04:00 and 06:00-10:00 UTC: input 1.32, output 3.96, cached 0.044. Official limits are 1M context / 384K output; exact notation conversion deferred. No separate cache-creation fee verified."
      }
    },
    "deepseek-v4-pro-none": {
      "capabilities": {
        "vision": false,
        "tools": true,
        "reasoning": true,
        "thinkingCanDisable": true
      },
      "pricing": {
        "input": 0.66,
        "output": 1.98,
        "cached": 0.022
      },
      "sources": [
        "https://api-docs.deepseek.com/quick_start/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "time-dependent-payg",
        "note": "Off-peak USD/1M token rates shown. Peak Monday-Friday 01:00-04:00 and 06:00-10:00 UTC: input 1.32, output 3.96, cached 0.044. Official limits are 1M context / 384K output; exact notation conversion deferred. No separate cache-creation fee verified."
      }
    }
  },
  "alicode": {
    "qwen3.5-plus": {
      "capabilities": {
        "vision": true
      },
      "sources": [
        "https://help.aliyun.com/zh/model-studio/coding-plan"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "month",
        "kind": "subscription",
        "note": "Coding Plan subscription consumes request quota, not PAYG token charges. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "kimi-k2.6": {
      "sources": [
        "https://help.aliyun.com/zh/model-studio/coding-plan"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "month",
        "kind": "subscription",
        "note": "Coding Plan subscription consumes request quota, not PAYG token charges. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Compatibility ID retained; absent from current exhaustive supported-model list."
      }
    },
    "glm-5": {
      "sources": [
        "https://help.aliyun.com/zh/model-studio/coding-plan"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "month",
        "kind": "subscription",
        "note": "Coding Plan subscription consumes request quota, not PAYG token charges. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "MiniMax-M2.5": {
      "sources": [
        "https://help.aliyun.com/zh/model-studio/coding-plan"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "month",
        "kind": "subscription",
        "note": "Coding Plan subscription consumes request quota, not PAYG token charges. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "qwen3-max-2026-01-23": {
      "sources": [
        "https://help.aliyun.com/zh/model-studio/coding-plan"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "month",
        "kind": "subscription",
        "note": "Coding Plan subscription consumes request quota, not PAYG token charges. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "qwen3-coder-next": {
      "sources": [
        "https://help.aliyun.com/zh/model-studio/coding-plan"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "month",
        "kind": "subscription",
        "note": "Coding Plan subscription consumes request quota, not PAYG token charges. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "qwen3-coder-plus": {
      "sources": [
        "https://help.aliyun.com/zh/model-studio/coding-plan"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "month",
        "kind": "subscription",
        "note": "Coding Plan subscription consumes request quota, not PAYG token charges. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "qwen3-coder-flash": {
      "sources": [
        "https://help.aliyun.com/zh/model-studio/coding-plan"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "month",
        "kind": "subscription",
        "note": "Coding Plan subscription consumes request quota, not PAYG token charges. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Compatibility ID retained; absent from current exhaustive supported-model list."
      }
    },
    "glm-4.7": {
      "sources": [
        "https://help.aliyun.com/zh/model-studio/coding-plan"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "month",
        "kind": "subscription",
        "note": "Coding Plan subscription consumes request quota, not PAYG token charges. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "qwen3.7-plus": {
      "capabilities": {
        "vision": true
      },
      "sources": [
        "https://help.aliyun.com/zh/model-studio/coding-plan"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "month",
        "kind": "subscription",
        "note": "Coding Plan subscription consumes request quota, not PAYG token charges. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "qwen3.6-plus": {
      "capabilities": {
        "vision": true
      },
      "sources": [
        "https://help.aliyun.com/zh/model-studio/coding-plan"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "month",
        "kind": "subscription",
        "note": "Coding Plan subscription consumes request quota, not PAYG token charges. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "kimi-k2.5": {
      "capabilities": {
        "vision": true
      },
      "sources": [
        "https://help.aliyun.com/zh/model-studio/coding-plan"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "month",
        "kind": "subscription",
        "note": "Coding Plan subscription consumes request quota, not PAYG token charges. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    }
  },
  "alicode-intl": {
    "qwen3.5-plus": {
      "capabilities": {
        "vision": true
      },
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/coding-plan"
      ],
      "billing": {
        "currency": "USD",
        "unit": "month",
        "kind": "subscription",
        "note": "Coding Plan subscription consumes request quota, not PAYG token charges. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "kimi-k2.5": {
      "capabilities": {
        "vision": true
      },
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/coding-plan"
      ],
      "billing": {
        "currency": "USD",
        "unit": "month",
        "kind": "subscription",
        "note": "Coding Plan subscription consumes request quota, not PAYG token charges. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-5": {
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/coding-plan"
      ],
      "billing": {
        "currency": "USD",
        "unit": "month",
        "kind": "subscription",
        "note": "Coding Plan subscription consumes request quota, not PAYG token charges. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "MiniMax-M2.5": {
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/coding-plan"
      ],
      "billing": {
        "currency": "USD",
        "unit": "month",
        "kind": "subscription",
        "note": "Coding Plan subscription consumes request quota, not PAYG token charges. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "qwen3-coder-next": {
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/coding-plan"
      ],
      "billing": {
        "currency": "USD",
        "unit": "month",
        "kind": "subscription",
        "note": "Coding Plan subscription consumes request quota, not PAYG token charges. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "qwen3-coder-plus": {
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/coding-plan"
      ],
      "billing": {
        "currency": "USD",
        "unit": "month",
        "kind": "subscription",
        "note": "Coding Plan subscription consumes request quota, not PAYG token charges. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-4.7": {
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/coding-plan"
      ],
      "billing": {
        "currency": "USD",
        "unit": "month",
        "kind": "subscription",
        "note": "Coding Plan subscription consumes request quota, not PAYG token charges. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "qwen3.7-plus": {
      "capabilities": {
        "vision": true
      },
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/coding-plan"
      ],
      "billing": {
        "currency": "USD",
        "unit": "month",
        "kind": "subscription",
        "note": "Coding Plan subscription consumes request quota, not PAYG token charges. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "qwen3.6-plus": {
      "capabilities": {
        "vision": true
      },
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/coding-plan"
      ],
      "billing": {
        "currency": "USD",
        "unit": "month",
        "kind": "subscription",
        "note": "Coding Plan subscription consumes request quota, not PAYG token charges. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "qwen3-max-2026-01-23": {
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/coding-plan"
      ],
      "billing": {
        "currency": "USD",
        "unit": "month",
        "kind": "subscription",
        "note": "Coding Plan subscription consumes request quota, not PAYG token charges. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    }
  },
  "alitp-intl": {
    "qwen3.8-max": {
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/token-plan-personal-overview"
      ],
      "billing": {
        "unit": "credits",
        "kind": "subscription",
        "note": "Personal Token Plan uses dynamically calculated credits; only Singapore Global deployment. Plan-specific maximum input/output is unverified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "qwen3.8-flash": {
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/token-plan-personal-overview"
      ],
      "billing": {
        "unit": "credits",
        "kind": "subscription",
        "note": "Personal Token Plan uses dynamically calculated credits; only Singapore Global deployment. Plan-specific maximum input/output is unverified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "qwen3.7-max": {
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/token-plan-personal-overview"
      ],
      "billing": {
        "unit": "credits",
        "kind": "subscription",
        "note": "Personal Token Plan uses dynamically calculated credits; only Singapore Global deployment. Plan-specific maximum input/output is unverified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "qwen3.7-plus": {
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/token-plan-personal-overview"
      ],
      "billing": {
        "unit": "credits",
        "kind": "subscription",
        "note": "Personal Token Plan uses dynamically calculated credits; only Singapore Global deployment. Plan-specific maximum input/output is unverified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "qwen3.7-flash": {
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/token-plan-personal-overview"
      ],
      "billing": {
        "unit": "credits",
        "kind": "subscription",
        "note": "Personal Token Plan uses dynamically calculated credits; only Singapore Global deployment. Plan-specific maximum input/output is unverified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "qwen3.6-plus": {
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/token-plan-personal-overview"
      ],
      "billing": {
        "unit": "credits",
        "kind": "subscription",
        "note": "Personal Token Plan uses dynamically calculated credits; only Singapore Global deployment. Plan-specific maximum input/output is unverified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "qwen3.6-flash": {
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/token-plan-personal-overview"
      ],
      "billing": {
        "unit": "credits",
        "kind": "subscription",
        "note": "Personal Token Plan uses dynamically calculated credits; only Singapore Global deployment. Plan-specific maximum input/output is unverified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "qwen3.5-flash": {
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/token-plan-personal-overview"
      ],
      "billing": {
        "unit": "credits",
        "kind": "subscription",
        "note": "Personal Token Plan uses dynamically calculated credits; only Singapore Global deployment. Plan-specific maximum input/output is unverified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-5.2": {
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/token-plan-personal-overview"
      ],
      "billing": {
        "unit": "credits",
        "kind": "subscription",
        "note": "Personal Token Plan uses dynamically calculated credits; only Singapore Global deployment. Plan-specific maximum input/output is unverified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "deepseek-v4-pro": {
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/token-plan-personal-overview"
      ],
      "billing": {
        "unit": "credits",
        "kind": "subscription",
        "note": "Personal Token Plan uses dynamically calculated credits; only Singapore Global deployment. Plan-specific maximum input/output is unverified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "auto": {
      "capabilities": {
        "reasoning": true
      },
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/token-plan-personal-overview"
      ],
      "billing": {
        "unit": "credits",
        "kind": "subscription",
        "note": "Personal Token Plan uses dynamically calculated credits; only Singapore Global deployment. Plan-specific maximum input/output is unverified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "deepseek-v4.1-flash": {
      "capabilities": {
        "reasoning": true,
        "vision": true
      },
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/token-plan-personal-overview"
      ],
      "billing": {
        "unit": "credits",
        "kind": "subscription",
        "note": "Personal Token Plan uses dynamically calculated credits; only Singapore Global deployment. Plan-specific maximum input/output is unverified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "deepseek-v4-pro-0813": {
      "capabilities": {
        "reasoning": true
      },
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/token-plan-personal-overview"
      ],
      "billing": {
        "unit": "credits",
        "kind": "subscription",
        "note": "Personal Token Plan uses dynamically calculated credits; only Singapore Global deployment. Plan-specific maximum input/output is unverified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "deepseek-v4-flash-0731": {
      "capabilities": {
        "reasoning": true
      },
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/token-plan-personal-overview"
      ],
      "billing": {
        "unit": "credits",
        "kind": "subscription",
        "note": "Personal Token Plan uses dynamically calculated credits; only Singapore Global deployment. Plan-specific maximum input/output is unverified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-5.3": {
      "capabilities": {
        "reasoning": true
      },
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/token-plan-personal-overview"
      ],
      "billing": {
        "unit": "credits",
        "kind": "subscription",
        "note": "Personal Token Plan uses dynamically calculated credits; only Singapore Global deployment. Plan-specific maximum input/output is unverified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    }
  },
  "alims-intl": {
    "qwen3.8-max": {
      "pricing": {
        "input": 2,
        "output": 6
      },
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/model-pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg-list",
        "note": "International deployment, USD per million tokens. Model output caps were not independently verified."
      }
    },
    "qwen3.8-flash": {
      "pricing": {
        "input": 0.15,
        "output": 0.47
      },
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/model-pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg-list",
        "note": "International deployment, USD per million tokens. Model output caps were not independently verified."
      }
    },
    "qwen3.7-plus": {
      "pricing": {
        "input": 0.4,
        "output": 1.6,
        "tier": {
          "threshold": 256000,
          "input": 1.2,
          "output": 4.8
        }
      },
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/model-pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg-list",
        "note": "International deployment, USD per million tokens. Model output caps were not independently verified. Input tiers are <=256K and >256K through 1M. Published list prices; limited-time 20% promotion is not applied here."
      }
    },
    "qwen3.6-plus": {
      "pricing": {
        "input": 0.5,
        "output": 3,
        "tier": {
          "threshold": 256000,
          "input": 2,
          "output": 6
        }
      },
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/model-pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg-list",
        "note": "International deployment, USD per million tokens. Model output caps were not independently verified. Input tiers are <=256K and >256K through 1M."
      }
    },
    "qwen3.5-plus": {
      "pricing": {
        "input": 0.4,
        "output": 2.4,
        "tier": {
          "threshold": 256000,
          "input": 0.5,
          "output": 3
        }
      },
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/model-pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "International deployment: <=256K / >256K through 1M input tiers. Cache charges not verified."
      }
    },
    "qwen3-coder-plus": {
      "sources": [
        "https://www.alibabacloud.com/help/en/model-studio/model-pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg-tiered",
        "note": "Four input-length tiers require resolver support: <=32K input/output 1/5; >32K through 128K 1.8/9; >128K through 256K 3/15; >256K through 1M 6/60. Existing fallback is a short-context estimate, not a universal rate."
      }
    }
  },
  "glm": {
    "glm-5.3": {
      "capabilities": {
        "vision": false,
        "reasoning": true,
        "tools": true,
        "thinkingCanDisable": false
      },
      "sources": [
        "https://docs.z.ai/devpack/latest-model.md",
        "https://docs.z.ai/guides/llm/glm-5.3.md"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Model docs: 1M context, 128K output (notation conversion deferred)."
      }
    },
    "glm-5.3-flash": {
      "capabilities": {
        "vision": true,
        "videoInput": true,
        "reasoning": true,
        "tools": true,
        "thinkingCanDisable": false
      },
      "sources": [
        "https://docs.z.ai/devpack/latest-model.md",
        "https://docs.z.ai/guides/vlm/glm-5.3-flash.md"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Model docs: 1M context, 128K output (notation conversion deferred)."
      }
    },
    "glm-5.3-flashx": {
      "sources": [
        "https://docs.z.ai/devpack/latest-model.md",
        "https://docs.z.ai/guides/vlm/glm-5.3-flash.md"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Not yet supported by the international Coding Plan; CN entitlement unverified. Existing ID retained for compatibility, not current entitlement proof."
      }
    },
    "glm-5.2": {
      "sources": [
        "https://docs.z.ai/devpack/latest-model.md"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-5.1": {
      "sources": [
        "https://docs.z.ai/devpack/latest-model.md"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-5": {
      "sources": [
        "https://docs.z.ai/devpack/latest-model.md"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-5-turbo": {
      "sources": [
        "https://docs.z.ai/devpack/latest-model.md"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-4.7": {
      "sources": [
        "https://docs.z.ai/devpack/latest-model.md"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-4.7-flash": {
      "sources": [
        "https://docs.z.ai/devpack/latest-model.md"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-4.7-flashx": {
      "sources": [
        "https://docs.z.ai/devpack/latest-model.md"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-4.6": {
      "sources": [
        "https://docs.z.ai/devpack/latest-model.md"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-4.6v": {
      "sources": [
        "https://docs.z.ai/devpack/latest-model.md"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-4.6v-flashx": {
      "sources": [
        "https://docs.z.ai/devpack/latest-model.md"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-4.5": {
      "sources": [
        "https://docs.z.ai/devpack/latest-model.md"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-4.5v": {
      "sources": [
        "https://docs.z.ai/devpack/latest-model.md"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-4.5-air": {
      "sources": [
        "https://docs.z.ai/devpack/latest-model.md"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    }
  },
  "glm-cn": {
    "glm-5.3": {
      "capabilities": {
        "vision": false,
        "reasoning": true,
        "tools": true,
        "thinkingCanDisable": false
      },
      "sources": [
        "https://docs.bigmodel.cn/cn/coding-plan/overview",
        "https://docs.z.ai/guides/llm/glm-5.3.md"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Model docs: 1M context, 128K output (notation conversion deferred)."
      }
    },
    "glm-5.3-flash": {
      "capabilities": {
        "vision": true,
        "videoInput": true,
        "reasoning": true,
        "tools": true,
        "thinkingCanDisable": false
      },
      "sources": [
        "https://docs.bigmodel.cn/cn/coding-plan/overview",
        "https://docs.z.ai/guides/vlm/glm-5.3-flash.md"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Model docs: 1M context, 128K output (notation conversion deferred); CN entitlement not independently verified."
      }
    },
    "glm-5.3-flashx": {
      "sources": [
        "https://docs.bigmodel.cn/cn/coding-plan/overview",
        "https://docs.z.ai/guides/vlm/glm-5.3-flash.md"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Not yet supported by the international Coding Plan; CN entitlement unverified. Existing ID retained for compatibility, not current entitlement proof."
      }
    },
    "glm-5.2": {
      "sources": [
        "https://docs.bigmodel.cn/cn/coding-plan/overview"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. CN Coding Plan automatically routes this historical ID to GLM-5.3."
      }
    },
    "glm-5.1": {
      "sources": [
        "https://docs.bigmodel.cn/cn/coding-plan/overview"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. CN Coding Plan automatically routes this historical ID to GLM-5.3."
      }
    },
    "glm-5": {
      "sources": [
        "https://docs.bigmodel.cn/cn/coding-plan/overview"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-5-turbo": {
      "sources": [
        "https://docs.bigmodel.cn/cn/coding-plan/overview"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-4.7": {
      "sources": [
        "https://docs.bigmodel.cn/cn/coding-plan/overview"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-4.7-flash": {
      "sources": [
        "https://docs.bigmodel.cn/cn/coding-plan/overview"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-4.7-flashx": {
      "sources": [
        "https://docs.bigmodel.cn/cn/coding-plan/overview"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-4.6v": {
      "sources": [
        "https://docs.bigmodel.cn/cn/coding-plan/overview"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-4.6v-flashx": {
      "sources": [
        "https://docs.bigmodel.cn/cn/coding-plan/overview"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-4.6": {
      "sources": [
        "https://docs.bigmodel.cn/cn/coding-plan/overview"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-4.5": {
      "sources": [
        "https://docs.bigmodel.cn/cn/coding-plan/overview"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-4.5v": {
      "sources": [
        "https://docs.bigmodel.cn/cn/coding-plan/overview"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-4.5-air": {
      "sources": [
        "https://docs.bigmodel.cn/cn/coding-plan/overview"
      ],
      "billing": {
        "unit": "points",
        "kind": "subscription",
        "note": "Coding Plan consumes points; not ordinary PAYG billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    }
  },
  "minimax": {
    "MiniMax-M2.7": {
      "capabilities": {
        "contextWindow": 204800
      },
      "pricing": {
        "input": 0.3,
        "output": 1.2,
        "cached": 0.06,
        "cache_creation": 0.375
      },
      "sources": [
        "https://platform.minimax.io/docs/guides/pricing-paygo.md",
        "https://platform.minimax.io/docs/api-reference/text-anthropic-api.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg-or-subscription",
        "note": "PAYG ordinary API keys and Subscription Keys have separate billing. No verified maximum output."
      }
    },
    "MiniMax-M2.7-highspeed": {
      "capabilities": {
        "contextWindow": 204800
      },
      "pricing": {
        "input": 0.6,
        "output": 2.4,
        "cached": 0.06,
        "cache_creation": 0.375
      },
      "sources": [
        "https://platform.minimax.io/docs/guides/pricing-paygo.md",
        "https://platform.minimax.io/docs/api-reference/text-anthropic-api.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg-or-subscription",
        "note": "PAYG ordinary API keys and Subscription Keys have separate billing. No verified maximum output."
      }
    },
    "MiniMax-M2.5": {
      "capabilities": {
        "contextWindow": 204800
      },
      "pricing": {
        "input": 0.3,
        "output": 1.2,
        "cached": 0.03,
        "cache_creation": 0.375
      },
      "sources": [
        "https://platform.minimax.io/docs/guides/pricing-paygo.md",
        "https://platform.minimax.io/docs/api-reference/text-anthropic-api.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg-or-subscription",
        "note": "PAYG ordinary API keys and Subscription Keys have separate billing. No verified maximum output."
      }
    },
    "MiniMax-M2.5-highspeed": {
      "capabilities": {
        "contextWindow": 204800
      },
      "pricing": {
        "input": 0.6,
        "output": 2.4,
        "cached": 0.03,
        "cache_creation": 0.375
      },
      "sources": [
        "https://platform.minimax.io/docs/guides/pricing-paygo.md",
        "https://platform.minimax.io/docs/api-reference/text-anthropic-api.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg-or-subscription",
        "note": "PAYG ordinary API keys and Subscription Keys have separate billing. No verified maximum output."
      }
    },
    "MiniMax-M2.1": {
      "capabilities": {
        "contextWindow": 204800
      },
      "pricing": {
        "input": 0.3,
        "output": 1.2,
        "cached": 0.03,
        "cache_creation": 0.375
      },
      "sources": [
        "https://platform.minimax.io/docs/guides/pricing-paygo.md",
        "https://platform.minimax.io/docs/api-reference/text-anthropic-api.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg-or-subscription",
        "note": "PAYG ordinary API keys and Subscription Keys have separate billing. No verified maximum output."
      }
    },
    "MiniMax-M2.1-highspeed": {
      "capabilities": {
        "contextWindow": 204800
      },
      "pricing": {
        "input": 0.6,
        "output": 2.4,
        "cached": 0.03,
        "cache_creation": 0.375
      },
      "sources": [
        "https://platform.minimax.io/docs/guides/pricing-paygo.md",
        "https://platform.minimax.io/docs/api-reference/text-anthropic-api.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg-or-subscription",
        "note": "PAYG ordinary API keys and Subscription Keys have separate billing. No verified maximum output."
      }
    },
    "MiniMax-M2": {
      "capabilities": {
        "contextWindow": 204800
      },
      "pricing": {
        "input": 0.3,
        "output": 1.2,
        "cached": 0.03,
        "cache_creation": 0.375
      },
      "sources": [
        "https://platform.minimax.io/docs/guides/pricing-paygo.md",
        "https://platform.minimax.io/docs/api-reference/text-anthropic-api.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg-or-subscription",
        "note": "PAYG ordinary API keys and Subscription Keys have separate billing. No verified maximum output."
      }
    },
    "MiniMax-M3": {
      "capabilities": {
        "contextWindow": 1000000
      },
      "pricing": {
        "input": 0.3,
        "output": 1.2,
        "cached": 0.06,
        "tier": {
          "threshold": 512000,
          "input": 0.6,
          "output": 2.4,
          "cached": 0.12
        }
      },
      "sources": [
        "https://platform.minimax.io/docs/guides/pricing-paygo.md",
        "https://platform.minimax.io/docs/api-reference/text-anthropic-api.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg-or-subscription",
        "note": "Standard PAYG <=512k / >512k input tiers; priority service costs 1.5x. Subscription Keys use separate credits. Maximum output and cache creation fee unverified."
      }
    }
  },
  "minimax-cn": {
    "MiniMax-M2.7": {
      "capabilities": {
        "contextWindow": 204800
      },
      "sources": [
        "https://platform.minimaxi.com/docs/guides/pricing-paygo.md",
        "https://platform.minimax.io/docs/api-reference/text-anthropic-api.md"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000000_tokens",
        "kind": "payg-or-subscription",
        "note": "PAYG ordinary API keys and Subscription Keys have separate billing. No verified maximum output. CNY PAYG input/output: 4.2/16.8 highspeed or 2.1/8.4 normal; cache read 0.42 for M2.7 else 0.21; cache write 2.625 per million tokens. No FX conversion. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "MiniMax-M2.7-highspeed": {
      "capabilities": {
        "contextWindow": 204800
      },
      "sources": [
        "https://platform.minimaxi.com/docs/guides/pricing-paygo.md",
        "https://platform.minimax.io/docs/api-reference/text-anthropic-api.md"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000000_tokens",
        "kind": "payg-or-subscription",
        "note": "PAYG ordinary API keys and Subscription Keys have separate billing. No verified maximum output. CNY PAYG input/output: 4.2/16.8 highspeed or 2.1/8.4 normal; cache read 0.42 for M2.7 else 0.21; cache write 2.625 per million tokens. No FX conversion. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "MiniMax-M2.5": {
      "capabilities": {
        "contextWindow": 204800
      },
      "sources": [
        "https://platform.minimaxi.com/docs/guides/pricing-paygo.md",
        "https://platform.minimax.io/docs/api-reference/text-anthropic-api.md"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000000_tokens",
        "kind": "payg-or-subscription",
        "note": "PAYG ordinary API keys and Subscription Keys have separate billing. No verified maximum output. CNY PAYG input/output: 4.2/16.8 highspeed or 2.1/8.4 normal; cache read 0.42 for M2.7 else 0.21; cache write 2.625 per million tokens. No FX conversion. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "MiniMax-M2.5-highspeed": {
      "capabilities": {
        "contextWindow": 204800
      },
      "sources": [
        "https://platform.minimaxi.com/docs/guides/pricing-paygo.md",
        "https://platform.minimax.io/docs/api-reference/text-anthropic-api.md"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000000_tokens",
        "kind": "payg-or-subscription",
        "note": "PAYG ordinary API keys and Subscription Keys have separate billing. No verified maximum output. CNY PAYG input/output: 4.2/16.8 highspeed or 2.1/8.4 normal; cache read 0.42 for M2.7 else 0.21; cache write 2.625 per million tokens. No FX conversion. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "MiniMax-M2.1": {
      "capabilities": {
        "contextWindow": 204800
      },
      "sources": [
        "https://platform.minimaxi.com/docs/guides/pricing-paygo.md",
        "https://platform.minimax.io/docs/api-reference/text-anthropic-api.md"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000000_tokens",
        "kind": "payg-or-subscription",
        "note": "PAYG ordinary API keys and Subscription Keys have separate billing. No verified maximum output. CNY PAYG input/output: 4.2/16.8 highspeed or 2.1/8.4 normal; cache read 0.42 for M2.7 else 0.21; cache write 2.625 per million tokens. No FX conversion. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "MiniMax-M2.1-highspeed": {
      "capabilities": {
        "contextWindow": 204800
      },
      "sources": [
        "https://platform.minimaxi.com/docs/guides/pricing-paygo.md",
        "https://platform.minimax.io/docs/api-reference/text-anthropic-api.md"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000000_tokens",
        "kind": "payg-or-subscription",
        "note": "PAYG ordinary API keys and Subscription Keys have separate billing. No verified maximum output. CNY PAYG input/output: 4.2/16.8 highspeed or 2.1/8.4 normal; cache read 0.42 for M2.7 else 0.21; cache write 2.625 per million tokens. No FX conversion. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "MiniMax-M2": {
      "capabilities": {
        "contextWindow": 204800
      },
      "sources": [
        "https://platform.minimaxi.com/docs/guides/pricing-paygo.md",
        "https://platform.minimax.io/docs/api-reference/text-anthropic-api.md"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000000_tokens",
        "kind": "payg-or-subscription",
        "note": "PAYG ordinary API keys and Subscription Keys have separate billing. No verified maximum output. CNY PAYG input/output: 4.2/16.8 highspeed or 2.1/8.4 normal; cache read 0.42 for M2.7 else 0.21; cache write 2.625 per million tokens. No FX conversion. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "MiniMax-M3": {
      "capabilities": {
        "contextWindow": 1000000
      },
      "sources": [
        "https://platform.minimaxi.com/docs/guides/pricing-paygo.md",
        "https://platform.minimax.io/docs/api-reference/text-anthropic-api.md"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000000_tokens",
        "kind": "payg-or-subscription",
        "note": "Standard PAYG <=512k / >512k input tiers; priority service costs 1.5x. Subscription Keys use separate credits. Maximum output and cache creation fee unverified. CNY input/output/cache-read: standard 2.1/8.4/0.42 short, 4.2/16.8/0.84 long; priority 3.15/12.6/0.63 short, 6.3/25.2/1.26 long. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    }
  },
  "kimi": {
    "k3": {
      "capabilities": {
        "contextWindow": 1048576,
        "vision": true,
        "videoInput": true,
        "reasoning": true,
        "thinkingCanDisable": true,
        "thinkingEffortSupported": true
      },
      "sources": [
        "https://www.kimi.com/code/docs/en/kimi-code/models.html"
      ],
      "billing": {
        "unit": "quota",
        "kind": "subscription",
        "note": "Kimi Code subscription; no verified maximum output. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. 1,048,576 context requires Pro/Allegretto or higher; Plus/Moderato context is 262,144. Thinking off is explicitly supported but routes to K2.8 Preview (no thinking), not the named thinking backend."
      }
    },
    "k3-256k": {
      "capabilities": {
        "contextWindow": 262144,
        "vision": true,
        "videoInput": false,
        "reasoning": true,
        "thinkingCanDisable": true,
        "thinkingEffortSupported": true
      },
      "sources": [
        "https://www.kimi.com/code/docs/en/kimi-code/models.html"
      ],
      "billing": {
        "unit": "quota",
        "kind": "subscription",
        "note": "Kimi Code subscription; no verified maximum output. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Thinking off is explicitly supported but routes to K2.8 Preview (no thinking), not the named thinking backend."
      }
    },
    "kimi-for-coding": {
      "capabilities": {
        "contextWindow": 1048576,
        "vision": true,
        "videoInput": true,
        "reasoning": true,
        "thinkingCanDisable": true,
        "thinkingEffortSupported": true
      },
      "sources": [
        "https://www.kimi.com/code/docs/en/kimi-code/models.html"
      ],
      "billing": {
        "unit": "quota",
        "kind": "subscription",
        "note": "Kimi Code subscription; no verified maximum output. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Thinking off is explicitly supported but routes to K2.8 Preview (no thinking), not the named thinking backend. Current backend is K2.8 Preview."
      }
    },
    "kimi-for-coding-highspeed": {
      "capabilities": {
        "contextWindow": 262144,
        "vision": true,
        "videoInput": true,
        "reasoning": true
      },
      "sources": [
        "https://www.kimi.com/code/docs/en/kimi-code/models.html"
      ],
      "billing": {
        "unit": "quota",
        "kind": "subscription",
        "note": "Kimi Code subscription; no verified maximum output. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "kimi-k3": {
      "sources": [
        "https://www.kimi.com/code/docs/en/kimi-code/models.html"
      ],
      "billing": {
        "kind": "unverified-route",
        "note": "PAYG ID retained for compatibility; this registry transport is Kimi Code and the Code allowlist does not prove this ID is supported. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "kimi-k2.7-code": {
      "sources": [
        "https://www.kimi.com/code/docs/en/kimi-code/models.html"
      ],
      "billing": {
        "kind": "unverified-route",
        "note": "PAYG ID retained for compatibility; this registry transport is Kimi Code and the Code allowlist does not prove this ID is supported. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "kimi-k2.7-code-highspeed": {
      "sources": [
        "https://www.kimi.com/code/docs/en/kimi-code/models.html"
      ],
      "billing": {
        "kind": "unverified-route",
        "note": "PAYG ID retained for compatibility; this registry transport is Kimi Code and the Code allowlist does not prove this ID is supported. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "kimi-k2.6": {
      "sources": [
        "https://www.kimi.com/code/docs/en/kimi-code/models.html"
      ],
      "billing": {
        "kind": "unverified-route",
        "note": "PAYG ID retained for compatibility; this registry transport is Kimi Code and the Code allowlist does not prove this ID is supported. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    }
  },
  "xiaomi-mimo": {
    "mimo-v2.6-pro": {
      "capabilities": {
        "vision": true,
        "audioInput": true,
        "videoInput": true,
        "reasoning": true,
        "tools": true,
        "search": true
      },
      "pricing": {
        "input": 0.435,
        "output": 0.87,
        "cached": 0.0036,
        "cache_creation": 0
      },
      "sources": [
        "https://mimo.mi.com/docs/en-US/quick-start/summary/model",
        "https://mimo.mi.com/docs/en-US/price/pay-as-you-go"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Official limits: 1M context / 128K output; decimal/binary conversion deferred. Overseas real-time USD rates; cache write is limited-time free. Web search is billed separately. China pricing differs."
      }
    },
    "mimo-v2.6-flash": {
      "capabilities": {
        "vision": true,
        "audioInput": true,
        "videoInput": true,
        "reasoning": true,
        "tools": true,
        "search": true
      },
      "pricing": {
        "input": 0.14,
        "output": 0.28,
        "cached": 0.0028,
        "cache_creation": 0
      },
      "sources": [
        "https://mimo.mi.com/docs/en-US/quick-start/summary/model",
        "https://mimo.mi.com/docs/en-US/price/pay-as-you-go"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Official limits: 1M context / 128K output; decimal/binary conversion deferred. Overseas real-time USD rates; cache write is limited-time free. Web search is billed separately. China pricing differs."
      }
    },
    "mimo-v2.5-pro": {
      "capabilities": {
        "vision": true,
        "audioInput": true,
        "videoInput": true,
        "reasoning": true,
        "tools": true,
        "search": true
      },
      "pricing": {
        "input": 0.435,
        "output": 0.87,
        "cached": 0.0036,
        "cache_creation": 0
      },
      "sources": [
        "https://mimo.mi.com/docs/en-US/quick-start/summary/model",
        "https://mimo.mi.com/docs/en-US/price/pay-as-you-go"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Official limits: 1M context / 128K output; decimal/binary conversion deferred. Overseas real-time USD rates; cache write is limited-time free. Web search is billed separately. China pricing differs. Retires October 21, 2026 at 10:00 Beijing time; compatibility ID retained."
      }
    },
    "mimo-v2.5": {
      "capabilities": {
        "vision": true,
        "audioInput": true,
        "videoInput": true,
        "reasoning": true,
        "tools": true,
        "search": true
      },
      "pricing": {
        "input": 0.14,
        "output": 0.28,
        "cached": 0.0028,
        "cache_creation": 0
      },
      "sources": [
        "https://mimo.mi.com/docs/en-US/quick-start/summary/model",
        "https://mimo.mi.com/docs/en-US/price/pay-as-you-go"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Official limits: 1M context / 128K output; decimal/binary conversion deferred. Overseas real-time USD rates; cache write is limited-time free. Web search is billed separately. China pricing differs. Retires October 21, 2026 at 10:00 Beijing time; compatibility ID retained."
      }
    }
  },
  "xiaomi-tokenplan": {
    "mimo-v2.6-pro": {
      "capabilities": {
        "vision": true,
        "audioInput": true,
        "videoInput": true,
        "reasoning": true,
        "tools": true,
        "search": true
      },
      "sources": [
        "https://mimo.mi.com/docs/en-US/quick-start/summary/model",
        "https://mimo.mi.com/docs/en-US/price/token-plan"
      ],
      "billing": {
        "unit": "credits",
        "kind": "subscription",
        "note": "Official limits: 1M context / 128K output; decimal/binary conversion deferred. Credits subscription: cache-hit/input/output credits per token are 2.5/300/600 for Pro, 2/100/200 for Flash; not USD token prices. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "mimo-v2.6-flash": {
      "capabilities": {
        "vision": true,
        "audioInput": true,
        "videoInput": true,
        "reasoning": true,
        "tools": true,
        "search": true
      },
      "sources": [
        "https://mimo.mi.com/docs/en-US/quick-start/summary/model",
        "https://mimo.mi.com/docs/en-US/price/token-plan"
      ],
      "billing": {
        "unit": "credits",
        "kind": "subscription",
        "note": "Official limits: 1M context / 128K output; decimal/binary conversion deferred. Credits subscription: cache-hit/input/output credits per token are 2.5/300/600 for Pro, 2/100/200 for Flash; not USD token prices. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "mimo-v2.5-pro": {
      "capabilities": {
        "vision": true,
        "audioInput": true,
        "videoInput": true,
        "reasoning": true,
        "tools": true,
        "search": true
      },
      "sources": [
        "https://mimo.mi.com/docs/en-US/quick-start/summary/model",
        "https://mimo.mi.com/docs/en-US/price/token-plan"
      ],
      "billing": {
        "unit": "credits",
        "kind": "subscription",
        "note": "Official limits: 1M context / 128K output; decimal/binary conversion deferred. Credits subscription: cache-hit/input/output credits per token are 2.5/300/600 for Pro, 2/100/200 for Flash; not USD token prices. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Retires October 21, 2026 at 10:00 Beijing time; compatibility ID retained."
      }
    },
    "mimo-v2.5": {
      "capabilities": {
        "vision": true,
        "audioInput": true,
        "videoInput": true,
        "reasoning": true,
        "tools": true,
        "search": true
      },
      "sources": [
        "https://mimo.mi.com/docs/en-US/quick-start/summary/model",
        "https://mimo.mi.com/docs/en-US/price/token-plan"
      ],
      "billing": {
        "unit": "credits",
        "kind": "subscription",
        "note": "Official limits: 1M context / 128K output; decimal/binary conversion deferred. Credits subscription: cache-hit/input/output credits per token are 2.5/300/600 for Pro, 2/100/200 for Flash; not USD token prices. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Retires October 21, 2026 at 10:00 Beijing time; compatibility ID retained."
      }
    },
    "mimo-v2.5-pro-claude": {
      "capabilities": {
        "vision": true,
        "audioInput": true,
        "videoInput": true,
        "reasoning": true,
        "tools": true,
        "search": true
      },
      "sources": [
        "https://mimo.mi.com/docs/en-US/quick-start/summary/model",
        "https://mimo.mi.com/docs/en-US/price/token-plan"
      ],
      "billing": {
        "unit": "credits",
        "kind": "subscription",
        "note": "Official limits: 1M context / 128K output; decimal/binary conversion deferred. Credits subscription: cache-hit/input/output credits per token are 2.5/300/600 for Pro, 2/100/200 for Flash; not USD token prices. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Retires October 21, 2026 at 10:00 Beijing time; compatibility ID retained."
      }
    }
  },
  "cohere": {
    "command-a-03-2025": {
      "capabilities": {
        "maxOutput": 8000,
        "vision": false
      },
      "sources": [
        "https://docs.cohere.com/docs/models.md",
        "https://docs.cohere.com/docs/compatibility-api.md"
      ],
      "billing": {
        "kind": "unverified-pricing",
        "note": "Official context literal 256k; output 8k. Output caps follow existing decimal-k catalog convention; context conversion otherwise deferred. Production token/cache tariff not verified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Compatibility guide uses /compatibility/v1/chat/completions, whereas the existing registry uses /v1/chat/completions; transport correction is deferred."
      }
    },
    "command-a-reasoning-08-2025": {
      "capabilities": {
        "maxOutput": 32000,
        "vision": false,
        "reasoning": true
      },
      "sources": [
        "https://docs.cohere.com/docs/models.md",
        "https://docs.cohere.com/docs/compatibility-api.md"
      ],
      "billing": {
        "kind": "unverified-pricing",
        "note": "Official context literal 256k; output 32k. Output caps follow existing decimal-k catalog convention; context conversion otherwise deferred. Production token/cache tariff not verified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Compatibility guide uses /compatibility/v1/chat/completions, whereas the existing registry uses /v1/chat/completions; transport correction is deferred."
      }
    },
    "command-a-vision-07-2025": {
      "capabilities": {
        "maxOutput": 8000,
        "vision": true
      },
      "sources": [
        "https://docs.cohere.com/docs/models.md",
        "https://docs.cohere.com/docs/compatibility-api.md"
      ],
      "billing": {
        "kind": "unverified-pricing",
        "note": "Official context literal 128K; output 8k. Output caps follow existing decimal-k catalog convention; context conversion otherwise deferred. Production token/cache tariff not verified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Compatibility guide uses /compatibility/v1/chat/completions, whereas the existing registry uses /v1/chat/completions; transport correction is deferred."
      }
    },
    "command-a-translate-08-2025": {
      "capabilities": {
        "maxOutput": 8000,
        "vision": false
      },
      "sources": [
        "https://docs.cohere.com/docs/models.md",
        "https://docs.cohere.com/docs/compatibility-api.md"
      ],
      "billing": {
        "kind": "unverified-pricing",
        "note": "Official context literal 8K; output 8k. Output caps follow existing decimal-k catalog convention; context conversion otherwise deferred. Production token/cache tariff not verified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Compatibility guide uses /compatibility/v1/chat/completions, whereas the existing registry uses /v1/chat/completions; transport correction is deferred."
      }
    },
    "command-a-plus-05-2026": {
      "capabilities": {
        "maxOutput": 64000,
        "vision": true,
        "reasoning": true
      },
      "sources": [
        "https://docs.cohere.com/docs/models.md",
        "https://docs.cohere.com/docs/compatibility-api.md"
      ],
      "billing": {
        "kind": "unverified-pricing",
        "note": "Official context literal 128k; output 64k. Output caps follow existing decimal-k catalog convention; context conversion otherwise deferred. Production token/cache tariff not verified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Compatibility guide uses /compatibility/v1/chat/completions, whereas the existing registry uses /v1/chat/completions; transport correction is deferred."
      }
    },
    "command-r-plus-08-2024": {
      "capabilities": {
        "maxOutput": 4000,
        "vision": false
      },
      "sources": [
        "https://docs.cohere.com/docs/models.md",
        "https://docs.cohere.com/docs/compatibility-api.md"
      ],
      "billing": {
        "kind": "unverified-pricing",
        "note": "Official context literal 128k; output 4k. Output caps follow existing decimal-k catalog convention; context conversion otherwise deferred. Production token/cache tariff not verified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Compatibility guide uses /compatibility/v1/chat/completions, whereas the existing registry uses /v1/chat/completions; transport correction is deferred."
      }
    },
    "command-r-08-2024": {
      "capabilities": {
        "maxOutput": 4000,
        "vision": false
      },
      "sources": [
        "https://docs.cohere.com/docs/models.md",
        "https://docs.cohere.com/docs/compatibility-api.md"
      ],
      "billing": {
        "kind": "unverified-pricing",
        "note": "Official context literal 128k; output 4k. Output caps follow existing decimal-k catalog convention; context conversion otherwise deferred. Production token/cache tariff not verified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Compatibility guide uses /compatibility/v1/chat/completions, whereas the existing registry uses /v1/chat/completions; transport correction is deferred."
      }
    },
    "command-r7b-12-2024": {
      "capabilities": {
        "maxOutput": 4000,
        "vision": false
      },
      "sources": [
        "https://docs.cohere.com/docs/models.md",
        "https://docs.cohere.com/docs/compatibility-api.md"
      ],
      "billing": {
        "kind": "unverified-pricing",
        "note": "Official context literal 128k; output 4k. Output caps follow existing decimal-k catalog convention; context conversion otherwise deferred. Production token/cache tariff not verified. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Compatibility guide uses /compatibility/v1/chat/completions, whereas the existing registry uses /v1/chat/completions; transport correction is deferred."
      }
    }
  },
  "baidu": {
    "ernie-5.1": {
      "capabilities": {
        "maxOutput": 65536
      },
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Official CNY/1000-token tiers: [{\"input_condition\": \"<=32k\", \"input\": 0.004, \"output\": 0.018}, {\"input_condition\": \"32k<input<=128k\", \"input\": 0.006, \"output\": 0.022}]. Cache price unverified; no currency conversion."
      }
    },
    "ernie-5.0": {
      "capabilities": {
        "maxOutput": 65536
      },
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Official CNY/1000-token tiers: [{\"input_condition\": \"<=32k\", \"input\": 0.006, \"output\": 0.024}, {\"input_condition\": \"32k<input<=128k\", \"input\": 0.01, \"output\": 0.04}]. Cache price unverified; no currency conversion."
      }
    },
    "ernie-4.5-turbo-128k": {
      "capabilities": {
        "maxOutput": 12288
      },
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Detailed API max_tokens range [2,12288] takes precedence over conflicting 16k overview."
      }
    },
    "ernie-x1.1": {
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Official list marks impending offline; effective date unverified, compatibility ID preserved."
      }
    },
    "ernie-x1-turbo-32k": {
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "deepseek-v4-pro": {
      "capabilities": {
        "maxOutput": 393216
      },
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "deepseek-v4-flash": {
      "capabilities": {
        "maxOutput": 393216
      },
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Official list marks impending offline; effective date unverified, compatibility ID preserved."
      }
    },
    "glm-5.2": {
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-5.1": {
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "kimi-k2.6": {
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill. Official list marks impending offline; effective date unverified, compatibility ID preserved."
      }
    },
    "qwen3.5-397b-a17b": {
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "qwen3.5-27b": {
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "ernie-5.0-thinking-preview": {
      "capabilities": {
        "maxOutput": 65536
      },
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "ernie-5.0-thinking-latest": {
      "capabilities": {
        "maxOutput": 65536
      },
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "ernie-5.0-thinking-exp": {
      "capabilities": {
        "maxOutput": 65536
      },
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "ernie-4.5-turbo-32k": {
      "capabilities": {
        "maxOutput": 12288
      },
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "ernie-4.5-turbo-20260402": {
      "capabilities": {
        "maxOutput": 12288
      },
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "ernie-4.5-turbo-vl": {
      "capabilities": {
        "maxOutput": 16384,
        "vision": true
      },
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "ernie-4.5-turbo-vl-32k": {
      "capabilities": {
        "maxOutput": 12288,
        "vision": true
      },
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "deepseek-v4.1-flash": {
      "capabilities": {
        "maxOutput": 393216
      },
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "deepseek-v4-pro-0813": {
      "capabilities": {
        "maxOutput": 393216
      },
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "deepseek-v4-flash-0731": {
      "capabilities": {
        "maxOutput": 393216
      },
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "qwen3.5-122b-a10b": {
      "capabilities": {
        "maxOutput": 65536
      },
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "qwen3.5-35b-a3b": {
      "capabilities": {
        "maxOutput": 65536
      },
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-5.3": {
      "capabilities": {
        "maxOutput": 131072
      },
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "glm-5.3-flash": {
      "capabilities": {
        "maxOutput": 131072
      },
      "sources": [
        "https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j"
      ],
      "billing": {
        "currency": "CNY",
        "unit": "per_1000_tokens",
        "kind": "payg",
        "note": "Qianfan-hosted route: no direct-vendor USD prices applied. k/M context and input notation conversion deferred. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    }
  },
  "mistral": {
    "zai-glm-5-3": {
      "capabilities": {
        "vision": false
      },
      "pricing": {
        "input": 1.4,
        "output": 4.4,
        "cached": 0.14
      },
      "sources": [
        "https://docs.mistral.ai/models/zai-glm-5-3",
        "https://docs.mistral.ai/inference/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Standard Mistral-hosted token pricing. Cache-creation fee and exact output caps not verified; published k/M context notation conversion deferred."
      }
    },
    "ministral-14b-2512": {
      "pricing": {
        "input": 0.2,
        "output": 0.2,
        "cached": 0.02
      },
      "sources": [
        "https://docs.mistral.ai/models/ministral-3-14b-25-12",
        "https://docs.mistral.ai/inference/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Standard Mistral-hosted token pricing. Cache-creation fee and exact output caps not verified; published k/M context notation conversion deferred."
      }
    },
    "ministral-8b-2512": {
      "pricing": {
        "input": 0.15,
        "output": 0.15,
        "cached": 0.015
      },
      "sources": [
        "https://docs.mistral.ai/models/ministral-3-8b-25-12",
        "https://docs.mistral.ai/inference/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Standard Mistral-hosted token pricing. Cache-creation fee and exact output caps not verified; published k/M context notation conversion deferred."
      }
    },
    "ministral-3b-2512": {
      "pricing": {
        "input": 0.1,
        "output": 0.1,
        "cached": 0.01
      },
      "sources": [
        "https://docs.mistral.ai/models/ministral-3-3b-25-12",
        "https://docs.mistral.ai/inference/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Standard Mistral-hosted token pricing. Cache-creation fee and exact output caps not verified; published k/M context notation conversion deferred."
      }
    },
    "mistral-large-latest": {
      "pricing": {
        "input": 0.5,
        "output": 1.5,
        "cached": 0.05
      },
      "sources": [
        "https://docs.mistral.ai/inference/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Standard Mistral-hosted token pricing. Cache-creation fee and exact output caps not verified; published k/M context notation conversion deferred."
      }
    },
    "mistral-medium-latest": {
      "pricing": {
        "input": 1.5,
        "output": 7.5,
        "cached": 0.15
      },
      "sources": [
        "https://docs.mistral.ai/inference/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Standard Mistral-hosted token pricing. Cache-creation fee and exact output caps not verified; published k/M context notation conversion deferred."
      }
    },
    "mistral-small-latest": {
      "pricing": {
        "input": 0.15,
        "output": 0.6,
        "cached": 0.015
      },
      "sources": [
        "https://docs.mistral.ai/inference/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Standard Mistral-hosted token pricing. Cache-creation fee and exact output caps not verified; published k/M context notation conversion deferred."
      }
    },
    "codestral-latest": {
      "pricing": {
        "input": 0.3,
        "output": 0.9,
        "cached": 0.03
      },
      "sources": [
        "https://docs.mistral.ai/inference/pricing"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Standard Mistral-hosted token pricing. Cache-creation fee and exact output caps not verified; published k/M context notation conversion deferred."
      }
    }
  },
  "poolside": {
    "poolside/laguna-s-2.1": {
      "sources": [
        "https://docs.poolside.ai/get-started/supported-models.md",
        "https://poolside.ai/models"
      ],
      "billing": {
        "kind": "promotional",
        "note": "S/XS hosted access is advertised limited-time free; no permanent paid tariff or exact maximum output verified. XS 2.1 model spec says 256K context, hosted effective cap and notation conversion pending. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "poolside/laguna-xs-2.1": {
      "sources": [
        "https://docs.poolside.ai/get-started/supported-models.md",
        "https://poolside.ai/models"
      ],
      "billing": {
        "kind": "promotional",
        "note": "S/XS hosted access is advertised limited-time free; no permanent paid tariff or exact maximum output verified. XS 2.1 model spec says 256K context, hosted effective cap and notation conversion pending. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    }
  },
  "perplexity": {
    "sonar-pro": {
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/migrate-from-sonar.md"
      ],
      "billing": {
        "kind": "legacy-migrating",
        "note": "Standalone Sonar Chat Completions support ended 2026-09-27. Synchronous/streaming compatibility requests are gradually reformulated into Agent API calls; async is unsupported. Old prices/output caps are not verified current migrated billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "sonar": {
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/migrate-from-sonar.md"
      ],
      "billing": {
        "kind": "legacy-migrating",
        "note": "Standalone Sonar Chat Completions support ended 2026-09-27. Synchronous/streaming compatibility requests are gradually reformulated into Agent API calls; async is unsupported. Old prices/output caps are not verified current migrated billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "sonar-reasoning-pro": {
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/migrate-from-sonar.md"
      ],
      "billing": {
        "kind": "legacy-migrating",
        "note": "Standalone Sonar Chat Completions support ended 2026-09-27. Synchronous/streaming compatibility requests are gradually reformulated into Agent API calls; async is unsupported. Old prices/output caps are not verified current migrated billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "sonar-deep-research": {
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/migrate-from-sonar.md"
      ],
      "billing": {
        "kind": "legacy-migrating",
        "note": "Standalone Sonar Chat Completions support ended 2026-09-27. Synchronous/streaming compatibility requests are gradually reformulated into Agent API calls; async is unsupported. Old prices/output caps are not verified current migrated billing. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    }
  },
  "perplexity-agent": {
    "anthropic/claude-fable-5": {
      "pricing": {
        "input": 10.0,
        "output": 50.0,
        "cached": 1.0
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "anthropic/claude-fable-5-1": {
      "pricing": {
        "input": 10.0,
        "output": 50.0,
        "cached": 0.25
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "anthropic/claude-opus-5-5": {
      "pricing": {
        "input": 4.0,
        "output": 20.0,
        "cached": 0.2
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "anthropic/claude-opus-5": {
      "pricing": {
        "input": 5.0,
        "output": 25.0,
        "cached": 0.5
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "anthropic/claude-opus-4-8": {
      "pricing": {
        "input": 5.0,
        "output": 25.0,
        "cached": 0.5
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "anthropic/claude-opus-4-7": {
      "pricing": {
        "input": 5.0,
        "output": 25.0,
        "cached": 0.5
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "anthropic/claude-opus-4-6": {
      "pricing": {
        "input": 5.0,
        "output": 25.0,
        "cached": 0.5
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "anthropic/claude-opus-4-5": {
      "pricing": {
        "input": 5.0,
        "output": 25.0,
        "cached": 0.5
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "anthropic/claude-sonnet-5-5": {
      "pricing": {
        "input": 2.0,
        "output": 10.0,
        "cached": 0.2
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "anthropic/claude-sonnet-5": {
      "pricing": {
        "input": 2.0,
        "output": 10.0,
        "cached": 0.2
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "anthropic/claude-sonnet-4-6": {
      "pricing": {
        "input": 3.0,
        "output": 15.0,
        "cached": 0.3
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "anthropic/claude-sonnet-4-5": {
      "pricing": {
        "input": 3.0,
        "output": 15.0,
        "cached": 0.3
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "anthropic/claude-haiku-4-5": {
      "pricing": {
        "input": 1.0,
        "output": 5.0,
        "cached": 0.1
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "openai/gpt-6.1-sol": {
      "pricing": {
        "input": 2.0,
        "output": 10.0,
        "cached": 0.1,
        "tier": {
          "threshold": 272000,
          "input": 4.0,
          "output": 15.0,
          "cached": 0.2
        }
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Supported flex is 0.5x and priority 2x listed token prices; service-tier calculation deferred. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "openai/gpt-6-sol": {
      "pricing": {
        "input": 2.0,
        "output": 10.0,
        "cached": 0.2,
        "tier": {
          "threshold": 272000,
          "input": 4.0,
          "output": 15.0,
          "cached": 0.4
        }
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Supported flex is 0.5x and priority 2x listed token prices; service-tier calculation deferred. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "openai/gpt-6-luna": {
      "pricing": {
        "input": 0.1,
        "output": 0.5,
        "cached": 0.01,
        "tier": {
          "threshold": 272000,
          "input": 0.2,
          "output": 0.75,
          "cached": 0.02
        }
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Supported flex is 0.5x and priority 2x listed token prices; service-tier calculation deferred. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "openai/gpt-5.6-sol": {
      "pricing": {
        "input": 4.0,
        "output": 20.0,
        "cached": 0.4,
        "tier": {
          "threshold": 272000,
          "input": 8.0,
          "output": 30.0,
          "cached": 0.8
        }
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Supported flex is 0.5x and priority 2x listed token prices; service-tier calculation deferred. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "openai/gpt-5.6-terra": {
      "pricing": {
        "input": 2.0,
        "output": 12.0,
        "cached": 0.2,
        "tier": {
          "threshold": 272000,
          "input": 4.0,
          "output": 18.0,
          "cached": 0.4
        }
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Supported flex is 0.5x and priority 2x listed token prices; service-tier calculation deferred. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "openai/gpt-5.6-luna": {
      "pricing": {
        "input": 0.2,
        "output": 1.2,
        "cached": 0.02,
        "tier": {
          "threshold": 272000,
          "input": 0.4,
          "output": 1.8,
          "cached": 0.04
        }
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Supported flex is 0.5x and priority 2x listed token prices; service-tier calculation deferred. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "openai/gpt-5.5": {
      "pricing": {
        "input": 5.0,
        "output": 30.0,
        "cached": 0.5,
        "tier": {
          "threshold": 272000,
          "input": 10.0,
          "output": 45.0,
          "cached": 0.5
        }
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Supported flex is 0.5x and priority 2x listed token prices; service-tier calculation deferred. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "google/gemini-3.1-pro-preview": {
      "pricing": {
        "input": 2.0,
        "output": 12.0,
        "cached": 0.2,
        "tier": {
          "threshold": 200000,
          "input": 4.0,
          "output": 18.0,
          "cached": 0.4
        }
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "google/gemini-3.1-flash-lite": {
      "pricing": {
        "input": 0.25,
        "output": 1.5,
        "cached": 0.025
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "google/gemini-3.5-flash": {
      "pricing": {
        "input": 1.5,
        "output": 9.0,
        "cached": 0.15
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "google/gemini-3.5-flash-lite": {
      "pricing": {
        "input": 0.3,
        "output": 2.5,
        "cached": 0.03
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "google/gemini-3.6-flash": {
      "pricing": {
        "input": 1.5,
        "output": 7.5,
        "cached": 0.15
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "google/gemini-3.7-flash": {
      "pricing": {
        "input": 0.75,
        "output": 3.75,
        "cached": 0.075
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "google/gemini-3.8-flash": {
      "pricing": {
        "input": 0.75,
        "output": 3.75,
        "cached": 0.075
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "google/gemini-3-flash-preview": {
      "pricing": {
        "input": 0.5,
        "output": 3.0,
        "cached": 0.05
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "xai/grok-4.7": {
      "pricing": {
        "input": 2.0,
        "output": 6.0,
        "cached": 0.5
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. High tier starts at >=200k input: input 4.0, output 12.0, cached 1.0; boundary cannot be encoded losslessly by the existing >threshold tier shape. Numeric fields shown are <200k only. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "xai/grok-4.6": {
      "pricing": {
        "input": 2.0,
        "output": 6.0,
        "cached": 0.5
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. High tier starts at >=200k input: input 4.0, output 12.0, cached 1.0; boundary cannot be encoded losslessly by the existing >threshold tier shape. Numeric fields shown are <200k only. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "xai/grok-4.5": {
      "pricing": {
        "input": 2.0,
        "output": 6.0,
        "cached": 0.3
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. High tier starts at >=200k input: input 4.0, output 12.0, cached 0.6; boundary cannot be encoded losslessly by the existing >threshold tier shape. Numeric fields shown are <200k only. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "xai/grok-4.3": {
      "pricing": {
        "input": 1.25,
        "output": 2.5,
        "cached": 0.2
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. High tier starts at >=200k input: input 2.5, output 5.0, cached 0.2; boundary cannot be encoded losslessly by the existing >threshold tier shape. Numeric fields shown are <200k only. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "xai/grok-4.20-reasoning": {
      "pricing": {
        "input": 1.25,
        "output": 2.5,
        "cached": 0.2
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. High tier starts at >=200k input: input 2.5, output 5.0, cached 0.2; boundary cannot be encoded losslessly by the existing >threshold tier shape. Numeric fields shown are <200k only. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "xai/grok-4.20-non-reasoning": {
      "pricing": {
        "input": 1.25,
        "output": 2.5,
        "cached": 0.2
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. High tier starts at >=200k input: input 2.5, output 5.0, cached 0.2; boundary cannot be encoded losslessly by the existing >threshold tier shape. Numeric fields shown are <200k only. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "xai/grok-4.20-multi-agent": {
      "pricing": {
        "input": 1.25,
        "output": 2.5,
        "cached": 0.2
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. High tier starts at >=200k input: input 2.5, output 5.0, cached 0.2; boundary cannot be encoded losslessly by the existing >threshold tier shape. Numeric fields shown are <200k only. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "perplexity/glm-5.3": {
      "pricing": {
        "input": 1.4,
        "output": 4.4,
        "cached": 0.26
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "perplexity/glm-5.3-flash": {
      "pricing": {
        "input": 0.15,
        "output": 0.5,
        "cached": 0.03
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "perplexity/kimi-k3": {
      "pricing": {
        "input": 3.0,
        "output": 15.0,
        "cached": 0.3
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "perplexity/nemotron-3-ultra-550b-a55b": {
      "pricing": {
        "input": 0.25,
        "output": 2.5,
        "cached": 0.25
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "perplexity/sonar": {
      "pricing": {
        "input": 0.25,
        "output": 2.5,
        "cached": 0.0625
      },
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "currency": "USD",
        "unit": "per_1000000_tokens",
        "kind": "payg",
        "note": "Agent API default-processing USD token prices only; tools and other per-invocation charges are separate. No Agent-route context/output/modality claims inferred from vendor-global specs. Official quickstart explicitly accepts /v1/responses as an alias of /v1/agent; existing transport is retained. No authenticated inference probe performed."
      }
    },
    "openai/gpt-5.4": {
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "kind": "unverified-legacy",
        "note": "Absent from current Agent model table, but absence alone does not prove rejection. Compatibility ID retained. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "openai/gpt-5.4-mini": {
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "kind": "unverified-legacy",
        "note": "Absent from current Agent model table, but absence alone does not prove rejection. Compatibility ID retained. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    },
    "perplexity/kimi-k2.7-code": {
      "sources": [
        "https://docs.perplexity.ai/docs/agent-api/models.md",
        "https://docs.perplexity.ai/docs/agent-api/quickstart.md"
      ],
      "billing": {
        "kind": "unverified-legacy",
        "note": "Absent from current Agent model table, but absence alone does not prove rejection. Compatibility ID retained. Existing fallback token rates, if any, are retained only as unverified estimates, not a statement of this route's bill."
      }
    }
  }
};
