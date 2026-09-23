import { describe, it, expect } from "vitest";
import { MODEL_PRICING, getPricingForModel } from "../../open-sse/providers/pricing.js";

// Official Claude API pricing (platform.claude.com/docs/en/models/overview,
// verified 2026-09-23): Opus 5.5 $4/$20, Sonnet 5 $2/$10, Opus 5 $5/$25,
// Haiku 4.5 $1/$5. Exact entries must win over the claude-opus-*/
/// claude-sonnet-* pattern fallbacks.
describe("Current Claude lineup pricing", () => {
  it("prices claude-opus-5-5 at 4/20 (not the 5/25 opus pattern)", () => {
    expect(MODEL_PRICING["claude-opus-5-5"]).toMatchObject({ input: 4.0, output: 20.0, cached: 0.2 });
    expect(getPricingForModel("claude", "claude-opus-5-5").input).toBe(4.0);
  });

  it("prices the dated claude-opus-5-5-20260922 snapshot identically", () => {
    expect(MODEL_PRICING["claude-opus-5-5-20260922"]).toMatchObject({ input: 4.0, output: 20.0 });
  });

  it("prices the dot-form claude-opus-5.5 alias identically", () => {
    expect(getPricingForModel("claude", "claude-opus-5.5").input).toBe(4.0);
  });

  it("prices claude-sonnet-5 at 2/10 (not the 3/15 sonnet pattern)", () => {
    expect(MODEL_PRICING["claude-sonnet-5"]).toMatchObject({ input: 2.0, output: 10.0, cached: 0.2 });
    expect(getPricingForModel("claude", "claude-sonnet-5").input).toBe(2.0);
  });

  it("prices claude-opus-5 at 5/25", () => {
    expect(MODEL_PRICING["claude-opus-5"]).toMatchObject({ input: 5.0, output: 25.0, cached: 0.5 });
  });

  it("prices the claude-haiku-4.5 dot alias at 1/5 like the dated snapshot", () => {
    expect(MODEL_PRICING["claude-haiku-4.5"]).toMatchObject({ input: 1.0, output: 5.0 });
    expect(getPricingForModel("claude", "claude-haiku-4.5").input).toBe(
      getPricingForModel("claude", "claude-haiku-4-5-20251001").input
    );
  });
});
