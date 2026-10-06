import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServer } from "node:http";
import { handleChatSearch } from "open-sse/handlers/search/chatSearch.js";

beforeEach(() => {
  for (const key of ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy", "NO_PROXY", "no_proxy"]) {
    vi.stubEnv(key, "");
  }
});
afterEach(() => vi.unstubAllEnvs());

describe("chat search fails closed on a broken configured strict proxy", () => {
  it("returns the strict transport failure when the real CONNECT proxy rejects the tunnel", async () => {
    const tunnels = [];
    const proxy = createServer((_req, res) => {
      res.writeHead(502);
      res.end();
    });
    proxy.on("connect", (req, socket) => {
      tunnels.push(req.url);
      socket.end("HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\nContent-Length: 0\r\n\r\n");
    });
    await new Promise(resolve => proxy.listen(0, "127.0.0.1", resolve));
    try {
      const result = await handleChatSearch({ provider: "gemini", query: "offline fixture", credentials: {
        apiKey: "offline-fixture", providerSpecificData: {
          connectionProxyEnabled: true,
          connectionProxyUrl: `http://127.0.0.1:${proxy.address().port}`,
          strictProxy: true,
        },
      } });
      expect(result.success).toBe(false);
      expect(result.status).toBe(502);
      // The strict-branch failure is returned, rather than a direct-fetch result.
      expect(result.error).toContain("Proxy required but failed (strictProxy=true)");
      expect(tunnels).toEqual(["generativelanguage.googleapis.com:443"]);
    } finally {
      proxy.closeAllConnections();
      await new Promise(resolve => proxy.close(resolve));
    }
  });
});
