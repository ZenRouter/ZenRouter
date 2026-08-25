import { afterAll, beforeAll, describe, expect, it } from "vitest";
import https from "node:https";
import { generateKeyPairSync, createPrivateKey } from "node:crypto";

/**
 * Bug: the MITM DNS bypass branch in `createBypassRequest` returned response
 * headers as a bare Map and omitted `arrayBuffer()`. Downstream code passes
 * the headers straight into `new Response(...)` (github.js, combo.js, codex.js)
 * — Map is not a valid HeadersInit, so the call throws on every Cursor /
 * GitHub Copilot / Antigravity call when DNS bypass is hit. The Cursor
 * executor also calls `response.arrayBuffer()` directly.
 *
 * These tests drive `createBypassRequest` against a local HTTPS server with
 * a self-signed cert. NODE_TLS_REJECT_UNAUTHORIZED=0 keeps the test isolated
 * from the real public-CA-only MITM_BYPASS_HOSTS list.
 */

const HOST = "127.0.0.1";

function buildSelfSignedCert() {
  // Minimal self-signed cert generated at test time. We don't ship the cert
  // material in the repo to keep this test deterministic across CI images.
  const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const privPem = privateKey.export({ type: "pkcs8", format: "pem" });
  // We don't actually need a real cert for the test — Node accepts any cert
  // when NODE_TLS_REJECT_UNAUTHORIZED=0. But we still need *something* in the
  // server context, so return the keypair and let https.createServer build
  // a default cert via snakeoil fallback.
  return { publicKey, privateKey: createPrivateKey(privPem) };
}

function startServer(handler) {
  return new Promise((resolve) => {
    const sockets = new Set();
    // Snakeoil cert — accepted only because NODE_TLS_REJECT_UNAUTHORIZED=0.
    const server = https.createServer(handler);
    server.on("connection", (sock) => {
      sockets.add(sock);
      sock.on("close", () => sockets.delete(sock));
    });
    server.listen(0, HOST, () => {
      const { port } = server.address();
      resolve({
        port,
        close: () =>
          new Promise((res) => {
            for (const s of sockets) s.destroy();
            server.close(() => res());
          }),
      };
    });
  });
}

describe("proxyFetch MITM bypass — response shape (#3514)", () => {
  let server;
  let __testing;
  let prevEnv;
  let prevTlsReject;

  beforeAll(async () => {
    prevEnv = {
      NODE_ENV: process.env.NODE_ENV,
      JWT_SECRET: process.env.JWT_SECRET,
    };
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET ||= "test-jwt-secret-please-do-not-use-in-prod-0123456789";
    prevTlsReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    server = await startServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        const payload = JSON.stringify({ received: body.length, ok: true });
        res.writeHead(200, {
          "Content-Type": "application/json",
          "X-Custom-Header": "test-value",
          "Set-Cookie": ["a=1", "b=2"],
        });
        res.end(payload);
      });
    });

    const mod = await import("open-sse/utils/proxyFetch.js");
    __testing = mod.__testing;
  });

  afterAll(async () => {
    if (server) await server.close();
    if (prevTlsReject === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prevTlsReject;
    for (const [k, v] of Object.entries(prevEnv)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it("returns a real Headers instance usable with `new Response(...)`", async () => {
    const url = new URL(`https://${HOST}:${server.port}/v1/messages`);
    const res = await __testing.createBypassRequest(url, HOST, { method: "POST", body: "ping" });

    expect(res.headers).toBeInstanceOf(Headers);
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(res.headers.get("x-custom-header")).toBe("test-value");

    // Constructing a Response must not throw — this is the exact shape the
    // GitHub executor / combo.js / codex.js handlers hand back. A bare Map
    // throws "Invalid header object" inside the Response constructor.
    expect(() => new Response("body", { headers: res.headers })).not.toThrow();
  });

  it("exposes arrayBuffer() for callers like the Cursor executor", async () => {
    const url = new URL(`https://${HOST}:${server.port}/v1/chat`);
    const res = await __testing.createBypassRequest(url, HOST, { method: "POST", body: "hi" });
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.length).toBeGreaterThan(0);
    expect(JSON.parse(buf.toString())).toEqual({ received: 2, ok: true });
  });

  it("text() and json() agree on the same bytes", async () => {
    const url = new URL(`https://${HOST}:${server.port}/v1/models`);
    const res = await __testing.createBypassRequest(url, HOST, { method: "POST" });
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ received: 0, ok: true });
  });

  it("preserves multi-value headers (e.g. Set-Cookie)", async () => {
    const url = new URL(`https://${HOST}:${server.port}/v1/messages`);
    const res = await __testing.createBypassRequest(url, HOST, { method: "POST" });
    const cookies = res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie")];
    expect(cookies).toEqual(expect.arrayContaining(["a=1", "b=2"]));
  });

  it("honors AbortSignal by destroying the in-flight socket", async () => {
    // Hang the server: never respond.
    const hanging = await startServer(() => { /* hang */ });

    const controller = new AbortController();
    setTimeout(() => controller.abort(), 100);

    const url = new URL(`https://${HOST}:${hanging.port}/hang`);
    await expect(
      __testing.createBypassRequest(url, HOST, {
        method: "POST",
        body: "x",
        signal: controller.signal,
      })
    ).rejects.toThrow();

    await hanging.close();
  });
});
