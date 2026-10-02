import { describe, expect, it } from "vitest";
import { checkFallbackError, extractResetsAtMs } from "../../open-sse/services/accountFallback.js";

describe("Client Abort and Compound Duration Resets", () => {
  it("ignores client aborts and does not trigger fallback or cooldown", () => {
    const r1 = checkFallbackError(499, "Client Closed Request");
    expect(r1.shouldFallback).toBe(false);
    expect(r1.cooldownMs).toBe(0);

    const r2 = checkFallbackError(502, "client_aborted");
    expect(r2.shouldFallback).toBe(false);
    expect(r2.cooldownMs).toBe(0);

    const r3 = checkFallbackError(500, "Error: aborted");
    expect(r3.shouldFallback).toBe(false);
    expect(r3.cooldownMs).toBe(0);
  });

  it("extracts compound reset durations accurately from upstream errors", () => {
    const now = Date.now();

    // 1m 51s = 111 seconds
    const m1 = extractResetsAtMs(null, '{"error":{"message":"[antigravity/gemini-3.8-flash-high] [403]: HTTP 403 (reset after 1m 51s)"}}');
    expect(m1).toBeGreaterThanOrEqual(now + 109 * 1000);
    expect(m1).toBeLessThanOrEqual(now + 113 * 1000);

    // 4m 22s = 262 seconds
    const m2 = extractResetsAtMs(null, 'Individual quota reached. Resets in 4m22s.');
    expect(m2).toBeGreaterThanOrEqual(now + 260 * 1000);
    expect(m2).toBeLessThanOrEqual(now + 264 * 1000);

    // 99h 31m 0s = 358260 seconds
    const m3 = extractResetsAtMs(null, 'Individual quota reached. Resets in 99h31m0s.');
    expect(m3).toBeGreaterThanOrEqual(now + 358250 * 1000);
    expect(m3).toBeLessThanOrEqual(now + 358270 * 1000);

    // 41.67s
    const m4 = extractResetsAtMs(null, 'Individual quota reached. Resets in 41.678850599s.');
    expect(m4).toBeGreaterThanOrEqual(now + 40 * 1000);
    expect(m4).toBeLessThanOrEqual(now + 43 * 1000);
  });

  it("applies compound reset duration cooldown to checkFallbackError across 403, 429, and 503", () => {
    const res = checkFallbackError(503, '{"error":{"message":"[antigravity/gemini-3.8-flash-high] [403]: HTTP 403 (reset after 1m 51s)"}}');
    expect(res.shouldFallback).toBe(true);
    expect(res.cooldownMs).toBeGreaterThanOrEqual(109 * 1000);
    expect(res.cooldownMs).toBeLessThanOrEqual(113 * 1000);
  });
});
