import { describe, expect, it } from "vitest";

describe("Fast-fail circuit breaker logic", () => {
  it("triggers fast-fail after consecutive identical systemic errors", () => {
    let consecutiveSameErrors = 0;
    const MAX_CONSECUTIVE_SAME_ERRORS = 3;
    let lastStatus = null;
    let fastFailed = false;

    const simulateAttempt = (status) => {
      if (lastStatus === status && (Number(status) === 402 || Number(status) === 403 || Number(status) >= 500)) {
        consecutiveSameErrors++;
      } else {
        consecutiveSameErrors = 1;
      }
      lastStatus = status;
      if (consecutiveSameErrors >= MAX_CONSECUTIVE_SAME_ERRORS) {
        fastFailed = true;
        return true;
      }
      return false;
    };

    expect(simulateAttempt(403)).toBe(false);
    expect(simulateAttempt(403)).toBe(false);
    expect(simulateAttempt(403)).toBe(true);
    expect(fastFailed).toBe(true);
  });
});
