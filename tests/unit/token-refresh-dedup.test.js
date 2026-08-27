import { describe, it, expect, vi } from "vitest";
import { dedupRefresh } from "../../open-sse/services/tokenRefresh/dedup.js";

describe("Token Refresh Dedup Cache Bounding & Lifecycle", () => {
  it("deduplicates concurrent refresh calls for the same key", async () => {
    let callCount = 0;
    const mockRefresh = async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 20));
      return { token: "new-access-token", count: callCount };
    };

    const p1 = dedupRefresh("test-provider", "old-token-1", mockRefresh);
    const p2 = dedupRefresh("test-provider", "old-token-1", mockRefresh);

    const [res1, res2] = await Promise.all([p1, p2]);

    expect(callCount).toBe(1);
    expect(res1.token).toBe("new-access-token");
    expect(res2.token).toBe("new-access-token");
  });

  it("reuses recent cached result within TTL", async () => {
    let callCount = 0;
    const mockRefresh = async () => {
      callCount++;
      return { token: "token-2" };
    };

    const res1 = await dedupRefresh("test-provider", "old-token-2", mockRefresh);
    const res2 = await dedupRefresh("test-provider", "old-token-2", mockRefresh);

    expect(callCount).toBe(1);
    expect(res1).toEqual(res2);
  });
});
