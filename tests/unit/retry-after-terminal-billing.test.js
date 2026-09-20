import { describe, expect, it } from "vitest";
import { checkFallbackError } from "../../open-sse/services/accountFallback.js";
import { createErrorResult, errorResponse } from "../../open-sse/utils/error.js";

describe("Retry-After and terminal billing error handling (#4147)", () => {
  it("classifies GLM / Z.AI no balance error as terminal", () => {
    const errorText = '{"error":{"code":"1113","message":"余额不足或无可用资源包,请充值。"}}';
    const result = checkFallbackError(429, errorText);
    expect(result.shouldFallback).toBe(true);
    expect(result.terminal).toBe(true);
  });

  it("classifies HTTP 402 payment required as terminal", () => {
    const result = checkFallbackError(402, "payment required");
    expect(result.shouldFallback).toBe(true);
    expect(result.terminal).toBe(true);
  });

  it("emits Retry-After header in errorResponse when retryAfterSec is provided", () => {
    const res = errorResponse(429, "Rate limit reached", {}, 30);
    expect(res.headers.get("Retry-After")).toBe("30");
  });

  it("calculates and includes Retry-After header in createErrorResult from resetsAtMs", () => {
    const resetsAtMs = Date.now() + 45 * 1000;
    const errResult = createErrorResult(429, "Rate limited", resetsAtMs);
    const retryHeader = errResult.response.headers.get("Retry-After");
    expect(Number(retryHeader)).toBeGreaterThanOrEqual(44);
    expect(Number(retryHeader)).toBeLessThanOrEqual(46);
  });
});
