import { describe, expect, it } from "vitest";
import { SSE_HEADERS, SSE_HEADERS_CORS, SSE_HEADERS_NO_BUFFER } from "open-sse/utils/sseConstants.js";

describe("SSE headers tuning for TTFT and no buffering", () => {
  it("SSE_HEADERS includes no-transform and X-Accel-Buffering: no", () => {
    expect(SSE_HEADERS["Cache-Control"]).toBe("no-cache, no-transform");
    expect(SSE_HEADERS["X-Accel-Buffering"]).toBe("no");
    expect(SSE_HEADERS["Connection"]).toBe("keep-alive");
  });

  it("SSE_HEADERS_CORS includes no-transform and X-Accel-Buffering: no", () => {
    expect(SSE_HEADERS_CORS["Cache-Control"]).toBe("no-cache, no-transform");
    expect(SSE_HEADERS_CORS["X-Accel-Buffering"]).toBe("no");
    expect(SSE_HEADERS_CORS["Access-Control-Allow-Origin"]).toBe("*");
  });

  it("SSE_HEADERS_NO_BUFFER includes no-transform", () => {
    expect(SSE_HEADERS_NO_BUFFER["Cache-Control"]).toBe("no-cache, no-transform");
    expect(SSE_HEADERS_NO_BUFFER["X-Accel-Buffering"]).toBe("no");
  });
});
