import { afterEach, describe, expect, it, vi } from "vitest";

const resolveDns = vi.fn(async () => true);
vi.mock("../../src/lib/tunnel/shared/dnsResolver.js", () => ({ resolveDns }));

const { waitForHealth } = await import("../../src/lib/tunnel/cloudflare/healthCheck.js");

const relay = "https://rabc123.abc-tunnel.us";
const direct = "https://quiet-cats.trycloudflare.com";

describe("Cloudflare tunnel health candidates (#3412)", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    resolveDns.mockReset();
    resolveDns.mockResolvedValue(true);
  });

  it("accepts the direct URL when relay registration is still unavailable", async () => {
    const attempts = [];
    globalThis.fetch = vi.fn(async (url) => {
      const origin = String(url).replace("/api/health", "");
      attempts.push(origin);
      return { ok: origin === direct };
    });

    await expect(waitForHealth([relay, direct])).resolves.toBe(direct);
    expect(attempts.slice(0, 2)).toEqual([relay, direct]);
  });

  it("preserves single URL compatibility", async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: true }));
    await expect(waitForHealth(relay)).resolves.toBe(relay);
  });

  it("rejects an empty candidate list", async () => {
    await expect(waitForHealth([])).rejects.toThrow("at least one URL");
  });
});