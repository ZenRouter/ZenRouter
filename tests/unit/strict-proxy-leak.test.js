import { describe, expect, it } from "vitest";
import { proxyAwareFetch } from "../../open-sse/utils/proxyFetch.js";

describe("Strict Proxy enforcement (#4007)", () => {
  it("throws when strictProxy=true but no proxy URL is configured", async () => {
    await expect(
      proxyAwareFetch("https://api.openai.com/v1/chat/completions", {}, {
        strictProxy: true,
        connectionProxyEnabled: true,
        connectionProxyUrl: "",
      }),
    ).rejects.toThrow("strictProxy=true");
  });

  it("throws when strictProxy=true and the proxy connection fails", async () => {
    await expect(
      proxyAwareFetch("https://api.openai.com/v1/chat/completions", {}, {
        strictProxy: true,
        connectionProxyEnabled: true,
        connectionProxyUrl: "http://127.0.0.1:9", // unreachable port
      }),
    ).rejects.toThrow("strictProxy=true");
  });
});
