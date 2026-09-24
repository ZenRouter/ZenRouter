import { describe, it, expect } from "vitest";
import { checkFallbackError } from "../../open-sse/services/accountFallback.js";
import { getCapabilitiesForModel } from "../../open-sse/providers/capabilities.js";
import { resetHealthStateOnActivation } from "../../src/lib/db/repos/connectionsRepo.js";

// 9router #4271/#4263: model-scoped permanent 4xx must route around the dead
// member WITHOUT cooling the (healthy) account down.
describe("model-scoped permanent failures fall through, cooldown 0", () => {
  it.each([
    [400, "model is not entitled for this account"],
    [400, "Account not entitled to model claude-opus-5"],
    [400, "Claude Code 2.1.258 does not support this model; version 2.1.280 or newer is required (claude_code_version_too_old)"],
    [400, "No such model: swe-2"],
    [400, "Unknown model 'foo-bar'"],
    [400, "Unsupported model for this endpoint"],
    [400, "This model has been retired, migrate to swe-2"],
    [400, "That endpoint reached end of life"],
    [400, "Model no longer supported"],
  ])("falls back with zero cooldown on %i %s", (status, text) => {
    const r = checkFallbackError(status, text);
    expect(r.shouldFallback).toBe(true);
    expect(r.cooldownMs).toBe(0);
  });

  it("falls back with zero cooldown on bare 410 Gone", () => {
    const r = checkFallbackError(410, "Gone");
    expect(r.shouldFallback).toBe(true);
    expect(r.cooldownMs).toBe(0);
  });

  it("still returns the error (no fallback) for request-scoped 400s", () => {
    expect(checkFallbackError(400, "maximum context length exceeded")).toEqual({
      shouldFallback: false,
      cooldownMs: 0,
    });
  });
});

// 9router #4293: deepseek-v4-1-flash is natively multimodal upstream.
describe("deepseek-v4-1-flash vision caps", () => {
  it("reports vision:true with the 1M/384K envelope", () => {
    const caps = getCapabilitiesForModel("kenari", "deepseek-v4-1-flash");
    expect(caps.vision).toBe(true);
    expect(caps.reasoning).toBe(true);
    expect(caps.contextWindow).toBe(1000000);
    expect(caps.maxOutput).toBe(384000);
  });
});

// 9router #4250: activation clears stale cooldowns but keeps manual kill-switches.
describe("resetHealthStateOnActivation preserves far-future locks", () => {
  const existing = {
    modelLock_gpt5: new Date(Date.now() + 30_000).toISOString(),
    modelLock_dead: "2099-01-01T00:00:00.000Z",
  };
  it("nulls short cooldowns, keeps far-future manual locks", () => {
    const out = resetHealthStateOnActivation(existing, { testStatus: "active" });
    expect(out.testStatus).toBe("active");
    expect(out.backoffLevel).toBe(0);
    expect(out.modelLock_gpt5).toBeNull();
    expect(out.modelLock_dead).toBe("2099-01-01T00:00:00.000Z");
  });
  it("does nothing without an activation patch", () => {
    expect(resetHealthStateOnActivation(existing, { lastError: "x" })).toEqual({ lastError: "x" });
  });
});
