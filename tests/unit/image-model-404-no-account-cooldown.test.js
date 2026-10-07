// Regression: the reported Antigravity image failure was a 404 NOT_FOUND on an
// unavailable photo model. Because imageGenerationCore flattened that to 502,
// checkFallbackError treated it as a transient provider fault and cooled down
// every healthy pooled account (observed: 15/15 accounts locked at once).
//
// This locks in the causal chain: real 404 -> no account cooldown,
// flattened 502 -> cooldown (the bug being fixed).
import { describe, it, expect } from "vitest";
import { checkFallbackError } from "../../open-sse/services/accountFallback.js";

const NOT_FOUND_BODY = '{\n  "error": {\n    "code": 404,\n    "message": "Requested entity was not found.",\n    "status": "NOT_FOUND"\n  }\n}';

describe("unavailable image model must not cool down healthy accounts", () => {
  it("does not schedule a cooldown for the real 404 NOT_FOUND payload", () => {
    const decision = checkFallbackError(404, NOT_FOUND_BODY, 0);
    // Route around the unavailable model without locking the healthy account —
    // same convention as the existing 410 retired-model rule.
    expect(decision.cooldownMs).toBe(0);
    expect(decision.terminal).toBeUndefined();
  });

  it("still cools down a genuine transient 502", () => {
    const decision = checkFallbackError(502, "Bad Gateway", 0);
    expect(decision.shouldFallback).toBe(true);
    expect(decision.cooldownMs).toBeGreaterThan(0);
  });
});