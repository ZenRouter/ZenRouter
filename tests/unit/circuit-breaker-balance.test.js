import { describe, expect, it } from "vitest";
import { checkFallbackError } from "open-sse/services/accountFallback.js";

describe("Circuit breaker & balance_zero error rules", () => {
  it("classifies balance_zero and $0 balance with extended cooldown (15m)", () => {
    const res1 = checkFallbackError(403, "Your Token Harbor balance is at $0. Top up to keep using paid models.");
    expect(res1.shouldFallback).toBe(true);
    expect(res1.cooldownMs).toBe(15 * 60 * 1000);

    const res2 = checkFallbackError(400, "error: balance_zero");
    expect(res2.shouldFallback).toBe(true);
    expect(res2.cooldownMs).toBe(15 * 60 * 1000);
  });

  it("classifies HTTP 402 with extended cooldown (15m)", () => {
    const res = checkFallbackError(402, "Payment Required");
    expect(res.shouldFallback).toBe(true);
    expect(res.cooldownMs).toBe(15 * 60 * 1000);
  });
});
