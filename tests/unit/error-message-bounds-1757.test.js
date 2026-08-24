import { describe, expect, it } from "vitest";
import { MAX_UPSTREAM_ERROR_BYTES, parseUpstreamError } from "open-sse/utils/error.js";

function nestedProviderError(depth) {
  let message = "rate limit exceeded";
  for (let index = 0; index < depth; index += 1) {
    message = JSON.stringify({ error: { message, code: 429 } });
  }
  return JSON.stringify({ error: { message, code: 429 } });
}

describe("bounded upstream error messages (#1757)", () => {
  it("bounds recursively nested provider errors before they enter fallback state", async () => {
    const parsed = await parseUpstreamError(new Response(nestedProviderError(12), { status: 429 }));

    expect(parsed.statusCode).toBe(429);
    expect(parsed.message.length).toBeLessThanOrEqual(MAX_UPSTREAM_ERROR_BYTES);
  });

  it("never decodes more than the cap from a single oversized stream chunk", async () => {
    const oversized = new TextEncoder().encode("x".repeat(MAX_UPSTREAM_ERROR_BYTES * 128));
    const response = new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(oversized);
        controller.close();
      },
    }), { status: 429 });

    const parsed = await parseUpstreamError(response);
    expect(parsed.message).toHaveLength(MAX_UPSTREAM_ERROR_BYTES);
  });
});
