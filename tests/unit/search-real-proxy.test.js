import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServer } from "node:http";
import { handleChatSearch } from "open-sse/handlers/search/chatSearch.js";

beforeEach(() => {
  for (const key of ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy", "NO_PROXY", "no_proxy"]) {
    vi.stubEnv(key, "");
  }
});
afterEach(() => vi.unstubAllEnvs());

const credentials = { accessToken: "offline-fixture", projectId: "fixture-project", connectionId: "fixture-account" };

describe("real chat-search transport preserves account policy", () => {
  it.each(["antigravity", "gemini"])("%s excludes thought parts from grounded answers through a real relay", async (provider) => {
    const answer = "Final grounded answer";
    const requests = [];
    const server = createServer(async (req, res) => {
      let text = "";
      for await (const chunk of req) text += chunk;
      requests.push({ target: req.headers["x-relay-target"], path: req.headers["x-relay-path"], body: JSON.parse(text) });
      const payload = {
        candidates: [{ content: { parts: [
          { text: "Internal planning. ", thought: true },
          { text: "Final grounded ", thought: false },
          { text: "answer" },
          { text: " More internal planning.", thought: true },
          { thoughtSignature: "offline-signature" },
        ] }, groundingMetadata: {
          groundingChunks: [{ web: { uri: "https://example.com/source", title: "Source" } }],
          groundingSupports: [{ segment: { text: answer, startIndex: 0, endIndex: answer.length }, groundingChunkIndices: [0] }],
        } }], usageMetadata: { totalTokenCount: 12 },
      };
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(provider === "antigravity" ? { response: payload } : payload));
    });
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    try {
      const result = await handleChatSearch({ provider, query: "fixture", model: "gemini-3.8-flash", credentials: {
        ...credentials, providerSpecificData: { strictProxy: true, vercelRelayUrl: `http://127.0.0.1:${server.address().port}` },
      } });
      expect(result.success).toBe(true);
      expect(requests).toHaveLength(1);
      if (provider === "antigravity") {
        expect(requests[0].target).toBe("https://daily-cloudcode-pa.sandbox.googleapis.com");
        expect(requests[0].path).toBe("/v1internal:generateContent");
        expect(requests[0].body.model).toBe("gemini-3.8-flash-medium");
        expect(requests[0].body.request.tools).toEqual([{ googleSearch: {} }]);
        expect(requests[0].body.request.generationConfig.thinkingConfig).toMatchObject({ thinkingLevel: "medium", includeThoughts: true });
      } else {
        expect(requests[0].target).toBe("https://generativelanguage.googleapis.com");
        expect(requests[0].path).toBe("/v1beta/models/gemini-3.8-flash:generateContent");
        expect(requests[0].body.tools).toEqual([{ google_search: {} }]);
      }
      expect(result.data.results).toHaveLength(1);
      expect(result.data.results[0].url).toBe("https://example.com/source");
      expect(result.data.results[0].snippet).toBe(provider === "antigravity" ? answer : "");
      expect(result.data.usage.llm_tokens).toBe(12);
      expect.soft(result.data.answer.text).toBe(answer);
      expect.soft(result.data.results[0].content).toBe(provider === "antigravity" ? answer : null);
    } finally {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
  });

  it("blocks Antigravity direct egress when a strict proxy is missing", async () => {
    const result = await handleChatSearch({ provider: "antigravity", query: "fixture", credentials: {
      ...credentials, providerSpecificData: { strictProxy: true },
    } });
    expect(result.success).toBe(false);
    expect(result.status).toBe(502);
    expect(result.error).toContain("strictProxy=true");
  });

  it("sends Google grounding through an actual account relay with citations intact", async () => {
    const requests = [];
    const server = createServer(async (req, res) => {
      let text = "";
      for await (const chunk of req) text += chunk;
      requests.push({ target: req.headers["x-relay-target"], path: req.headers["x-relay-path"], body: JSON.parse(text) });
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ response: {
        candidates: [{ content: { parts: [{ text: "Grounded fixture" }] }, groundingMetadata: {
          groundingChunks: [
            { web: { uri: "https://example.com/fixture", title: "Fixture" } },
            { web: { uri: "https://example.com/fixture", title: "Fixture" } },
          ],
          groundingSupports: [{ segment: { text: "Grounded fixture", startIndex: 0, endIndex: 16 }, groundingChunkIndices: [0, 1] }],
        } }], usageMetadata: { totalTokenCount: 12 },
      } }));
    });
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    try {
      const result = await handleChatSearch({ provider: "antigravity", query: "fixture", model: "gemini-3.8-flash", credentials: {
        ...credentials, providerSpecificData: { strictProxy: true, vercelRelayUrl: `http://127.0.0.1:${server.address().port}` },
      } });
      expect(result.success).toBe(true);
      expect(requests).toHaveLength(1);
      expect(requests[0].target).toBe("https://daily-cloudcode-pa.sandbox.googleapis.com");
      expect(requests[0].path).toBe("/v1internal:generateContent");
      expect(requests[0].body.model).toBe("gemini-3.8-flash-medium");
      expect(requests[0].body.request.tools).toEqual([{ googleSearch: {} }]);
      expect(result.data.results).toHaveLength(1);
      expect(result.data.results[0].snippet).toBe("Grounded fixture");
      expect(result.data.usage.llm_tokens).toBe(12);
    } finally {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
  });
});
