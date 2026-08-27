// custom-server.js is the only thing that makes x-zen-real-ip trustworthy. Boot a real
// HTTP server through it and confirm a client cannot smuggle its own peer headers in.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createRequire } from "node:module";
import http from "node:http";
import { __test__ as requestDetails } from "@/lib/db/repos/requestDetailsRepo.js";

const require = createRequire(import.meta.url);

let server;
let baseUrl;
let seenHeaders;

beforeAll(async () => {
  require("../../custom-server.js");
  server = http.createServer((req, res) => {
    seenHeaders = req.headers;
    res.end("ok");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function get(headers = {}) {
  await fetch(baseUrl, { headers });
  return seenHeaders;
}

describe("custom-server peer header sanitizing", () => {
  it("generates a peer trust token at boot", () => {
    expect(process.env.ZENROUTER_PEER_TOKEN).toMatch(/^[0-9a-f]{48}$/);
    expect(process.env.NINEROUTER_PEER_TOKEN).toBe(process.env.ZENROUTER_PEER_TOKEN);
  });

  it("replaces a client-supplied x-zen-real-ip with the socket address", async () => {
    const headers = await get({ "x-zen-real-ip": "203.0.113.55" });

    expect(headers["x-zen-real-ip"]).toMatch(/^(::ffff:)?127\.0\.0\.1$/);
  });

  it("stamps the trust token so downstream can tell the wrapper ran", async () => {
    const headers = await get();

    expect(headers["x-zen-peer-token"]).toBe(process.env.ZENROUTER_PEER_TOKEN);
  });

  it("drops a client-supplied peer trust token", async () => {
    const headers = await get({ "x-zen-peer-token": "forged-token" });

    expect(headers["x-zen-peer-token"]).toBe(process.env.ZENROUTER_PEER_TOKEN);
    expect(headers["x-zen-peer-token"]).not.toBe("forged-token");
  });

  it("drops a client-supplied x-zen-via-proxy marker", async () => {
    const headers = await get({ "x-zen-via-proxy": "1" });

    expect(headers["x-zen-via-proxy"]).toBeUndefined();
  });

  it("marks via-proxy and adopts the forwarded IP for a loopback proxy hop", async () => {
    const headers = await get({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" });

    expect(headers["x-zen-via-proxy"]).toBe("1");
    expect(headers["x-zen-real-ip"]).toBe("203.0.113.9");
    expect(headers["x-forwarded-for"]).toBeUndefined();
  });

  // chat.js snapshots every client header into the request detail. Anything that grants
  // access must not survive into a record the dashboard renders and cloud sync uploads.
  it("keeps the peer token out of persisted request details", () => {
    const sanitized = requestDetails.sanitizeHeaders({
      "x-zen-peer-token": "secret",
      "x-zen-cli-token": "secret",
      "authorization": "Bearer sk-x",
      "x-zen-real-ip": "127.0.0.1",
    });

    expect(sanitized["x-zen-peer-token"]).toBeUndefined();
    expect(sanitized["x-zen-cli-token"]).toBeUndefined();
    expect(sanitized["authorization"]).toBeUndefined();
    expect(sanitized["x-zen-real-ip"]).toBe("127.0.0.1");
  });
});
