import { describe, expect, it, vi } from "vitest";
import { fetchProviderLiveModels } from "@/shared/utils/providerLiveModels.js";

describe("models context window propagation (#3750)", () => {
  it("extracts context_length and max_completion_tokens into capabilities from live catalog", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "openrouter/minimax-01",
              name: "MiniMax-01",
              context_length: 1000000,
              top_provider: {
                max_completion_tokens: 8192,
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    globalThis.fetch = fetchMock;

    try {
      const models = await fetchProviderLiveModels("openrouter", "test-key", { useCache: false });
      expect(models).toBeDefined();
      expect(models?.length).toBe(1);
      const m = models[0];
      expect(m.id).toBe("openrouter/minimax-01");
      expect(m.context_length).toBe(1000000);
      expect(m.max_completion_tokens).toBe(8192);
      expect(m.capabilities?.contextWindow).toBe(1000000);
      expect(m.capabilities?.maxOutput).toBe(8192);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
