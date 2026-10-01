import { describe, expect, it } from "vitest";
import { resolveCopilotModels } from "../../open-sse/services/copilotModels.js";

describe("Copilot live catalog limits & vision preservation", () => {
  it("preserves contextWindow, maxOutput, and vision from Copilot models API", async () => {
    // Mock fetch to simulate Copilot /models endpoint
    const mockData = {
      data: [
        {
          id: "gpt-5.6-copilot",
          name: "GPT 5.6 Copilot",
          capabilities: {
            type: "chat",
            limits: {
              max_context_window_tokens: 372000,
              max_output_tokens: 128000,
            },
            supports: {
              vision: true,
            },
          },
          policy: { state: "enabled" },
        },
      ],
    };

    const origFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify(mockData), { status: 200 });

    try {
      const res = await resolveCopilotModels(
        { accessToken: "gho_test", providerSpecificData: { copilotToken: "tid_123" } },
        { forceRefresh: true }
      );
      expect(res?.models).toBeDefined();
      const m = res.models.find((item) => item.id === "gpt-5.6-copilot");
      expect(m).toMatchObject({
        id: "gpt-5.6-copilot",
        contextLength: 372000,
        maxOutputTokens: 128000,
        capabilities: {
          contextWindow: 372000,
          maxOutput: 128000,
          vision: true,
        },
      });
    } finally {
      globalThis.fetch = origFetch;
    }
  });
});
