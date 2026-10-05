import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import dns from "node:dns";
import http from "node:http";
import net from "node:net";

// Keep DNS validation real; only map its already-approved socket to our fixture.
vi.mock("undici", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Agent: class extends actual.Agent {
      constructor(options) {
        const lookup = options?.connect?.lookup;
        super(lookup ? {
          ...options,
          connect: {
            ...options.connect,
            lookup(host, opts, callback) {
              lookup(host, opts, (error) => {
                if (error) return callback(error);
                if (opts.all) return callback(null, [{ address: "127.0.0.1", family: 4 }]);
                callback(null, "127.0.0.1", 4);
              });
            },
          },
        } : options);
      }
    },
  };
});

const nativeFetch = globalThis.fetch;
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
let server;
let proxy;
let base;
let proxyBase;
let defaultAgent;
let proxyAwareFetch;
let getDefaultAgent;
const tunnelSockets = new Set();

beforeAll(async () => {
  server = http.createServer((request, response) => {
    if (request.url === "/image.png") {
      response.writeHead(200, { "content-type": "image/png" });
      response.end(png);
    } else if (request.url === "/web-fetch") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ title: "Fixture", content: "loopback web content" }));
    } else {
      response.end("loopback transport");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  proxy = http.createServer();
  proxy.on("connect", (_request, socket, head) => {
    const upstream = net.connect(server.address().port, "127.0.0.1", () => {
      socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
      if (head.length) upstream.write(head);
      upstream.pipe(socket);
      socket.pipe(upstream);
    });
    for (const connection of [socket, upstream]) {
      tunnelSockets.add(connection);
      connection.on("error", () => connection.destroy());
      connection.on("close", () => tunnelSockets.delete(connection));
    }
  });
  await new Promise((resolve) => proxy.listen(0, "127.0.0.1", resolve));
  proxyBase = `http://127.0.0.1:${proxy.address().port}`;
  ({ proxyAwareFetch, getDefaultAgent } = await import("open-sse/utils/proxyFetch.js"));
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  if (defaultAgent) await defaultAgent.destroy();
  globalThis.fetch = nativeFetch;
  for (const socket of tunnelSockets) socket.destroy();
  for (const fixture of [proxy, server]) {
    fixture.closeAllConnections();
    await new Promise((resolve) => fixture.close(resolve));
  }
});

describe("Undici dispatchers at the Node native fetch boundary", () => {
  it("keeps the default pooled dispatcher compatible with Node's built-in fetch", async () => {
    defaultAgent = await getDefaultAgent();
    const response = await nativeFetch(base, { dispatcher: defaultAgent, signal: AbortSignal.timeout(2000) });
    expect(await response.text()).toBe("loopback transport");
  });

  it("retains real direct transport through the global proxy-aware fetch patch", async () => {
    const response = await proxyAwareFetch(base, { signal: AbortSignal.timeout(2000) });
    expect(await response.text()).toBe("loopback transport");
  });

  it("uses an explicit proxy without silently falling back to direct transport", async () => {
    const response = await proxyAwareFetch("http://proxy-target.invalid/echo", {
      signal: AbortSignal.timeout(2000),
    }, { enabled: true, url: proxyBase, strictProxy: true });
    expect(await response.text()).toBe("loopback transport");
  });

  it("preserves the pinned image dispatcher when global fetch is Node native fetch", async () => {
    const patchedFetch = globalThis.fetch;
    globalThis.fetch = nativeFetch;
    vi.spyOn(dns.promises, "lookup").mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    try {
      const { fetchImageAsBase64 } = await import("open-sse/translator/concerns/image.js");
      const result = await fetchImageAsBase64(`http://public-fixture.invalid:${server.address().port}/image.png`);
      expect(result).toEqual({ mimeType: "image/png", url: `data:image/png;base64,${png.toString("base64")}` });
    } finally {
      globalThis.fetch = patchedFetch;
    }
  });

  it("preserves the pinned web-fetch dispatcher when global fetch is Node native fetch", async () => {
    const patchedFetch = globalThis.fetch;
    globalThis.fetch = nativeFetch;
    vi.spyOn(dns.promises, "lookup").mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    try {
      const { handleFetchCore } = await import("open-sse/handlers/fetch/index.js");
      const result = await handleFetchCore({
        provider: "ollama",
        url: "https://requested-page.invalid/",
        providerConfig: { baseUrl: `http://public-fixture.invalid:${server.address().port}/web-fetch`, timeoutMs: 2000 },
      });
      expect(result.success).toBe(true);
      expect(result.data.content.text).toBe("loopback web content");
    } finally {
      globalThis.fetch = patchedFetch;
    }
  });
});
