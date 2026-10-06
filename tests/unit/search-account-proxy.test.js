import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ proxyAwareFetch: vi.fn() }));
vi.mock("open-sse/utils/proxyFetch.js", () => ({ proxyAwareFetch: mocks.proxyAwareFetch }));
import { handleChatSearch } from "open-sse/handlers/search/chatSearch.js";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.proxyAwareFetch.mockResolvedValue(new Response(JSON.stringify({
    response: { candidates: [{ content: { parts: [{ text: "fixture" }] } }] },
  }), { status: 200 }));
});

describe("chat search account egress policy", () => {
  it("forwards per-account proxy and strict policy to the same transport as chat", async () => {
    const policy = {
      connectionProxyEnabled: true, connectionProxyUrl: "http://127.0.0.1:9999",
      connectionNoProxy: "fixture.invalid", vercelRelayUrl: "", strictProxy: true,
    };
    // Native fetch must never be reached by this offline transport contract.
    const original = globalThis.fetch;
    const direct = vi.fn(async () => new Response("{}", { status: 404 }));
    globalThis.fetch = direct;
    try {
      const result = await handleChatSearch({ provider: "antigravity", model: "gemini-pro-agent", query: "fixture",
        credentials: { accessToken: "fixture", projectId: "fixture-project", providerSpecificData: policy } });
      expect(result.success).toBe(true);
      expect(direct).not.toHaveBeenCalled();
      expect(mocks.proxyAwareFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: "POST" }), policy);
    } finally { globalThis.fetch = original; }
  });
});
