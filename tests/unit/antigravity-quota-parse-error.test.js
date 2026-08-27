import { describe, it, expect } from "vitest";
import { AntigravityExecutor } from "../../open-sse/executors/antigravity.js";
import { HTTP_STATUS } from "../../open-sse/config/runtimeConfig.js";

describe("AntigravityExecutor - Quota Error & resetsAtMs parsing", () => {
  const executor = new AntigravityExecutor();

  it("extracts exact resetsAtMs from 409 error message reset string", () => {
    const errorBody = JSON.stringify({
      error: {
        code: 409,
        message: "Resource exhausted: Your quota will reset after 1h30m45s",
        status: "ABORTED"
      }
    });

    const response = new Response(errorBody, {
      status: HTTP_STATUS.CONFLICT,
      headers: { "Content-Type": "application/json" }
    });

    const before = Date.now();
    const parsed = executor.parseError(response, errorBody);
    const expectedDurationMs = (1 * 3600 + 30 * 60 + 45) * 1000;

    expect(parsed.status).toBe(HTTP_STATUS.CONFLICT);
    expect(parsed.resetsAtMs).toBeDefined();
    expect(parsed.resetsAtMs).toBeGreaterThanOrEqual(before + expectedDurationMs - 50);
    expect(parsed.resetsAtMs).toBeLessThanOrEqual(Date.now() + expectedDurationMs + 50);
  });

  it("extracts resetsAtMs from 429 Retry-After header", () => {
    const errorBody = JSON.stringify({
      error: { code: 429, message: "Rate limit exceeded" }
    });

    const response = new Response(errorBody, {
      status: HTTP_STATUS.RATE_LIMITED,
      headers: {
        "Content-Type": "application/json",
        "retry-after": "120"
      }
    });

    const before = Date.now();
    const parsed = executor.parseError(response, errorBody);

    expect(parsed.status).toBe(HTTP_STATUS.RATE_LIMITED);
    expect(parsed.resetsAtMs).toBeGreaterThanOrEqual(before + 120_000 - 50);
  });
});
