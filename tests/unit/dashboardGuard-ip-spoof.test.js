import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { isLocalRequest } from "../../src/dashboardGuard.js";

beforeAll(() => {
  // Peer-token must match what custom-server.js stamps at boot.
  process.env.NINEROUTER_PEER_TOKEN = "fingerprint";
});

afterEach(() => {
  // Tests must not leak state — never delete the env var here, vitest workers
  // are reused across files and we want all sibling tests to see the same token.
});

describe("isLocalRequest — IP spoofing defense (#3496)", () => {
  it("rejects dev-mode Host spoofing when peer headers are absent", () => {
    const headers = new Headers();
    headers.set("host", "localhost:20128");
    headers.set("origin", "http://localhost:20128");
    expect(isLocalRequest({ headers })).toBe(false);
  });

  it("trusts peer token + loopback IP stamped by custom-server", () => {
    const headers = new Headers();
    headers.set("x-9r-real-ip", "127.0.0.1");
    headers.set("x-9r-peer-token", "fingerprint");
    headers.set("origin", "http://localhost:20128");
    expect(isLocalRequest({ headers })).toBe(true);
  });

  it("rejects even with peer token when real IP is non-loopback", () => {
    const headers = new Headers();
    headers.set("x-9r-real-ip", "8.8.8.8");
    headers.set("x-9r-peer-token", "fingerprint");
    expect(isLocalRequest({ headers })).toBe(false);
  });
});
