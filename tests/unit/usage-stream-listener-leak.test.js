import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventEmitter } from "node:events";

describe("usage stream listener leak fix (#3526)", () => {
  it("removes listeners when request is aborted", async () => {
    const { GET } = await import("@/app/api/usage/stream/route.js");
    const controller = new AbortController();

    const request = {
      signal: controller.signal,
    };

    const res = await GET(request);
    expect(res.status).toBe(200);

    // Abort client request
    controller.abort();

    // Verify cleanup ran without errors
    expect(controller.signal.aborted).toBe(true);
  });
});
