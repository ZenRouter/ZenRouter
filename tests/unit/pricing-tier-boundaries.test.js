import { describe, expect, it } from "vitest";
import { calculateCostFromTokens, calculateCostBreakdown, resolveEffectivePricing } from "../../open-sse/providers/pricing.js";

describe("provider-specific inclusive pricing threshold", () => {
  const base = { input: 2, output: 6, cached: 0.5, reasoning: 6 };
  const tier = { threshold: 200000, inclusive: true, input: 4, output: 12, cached: 1 };
  it("activates an explicitly inclusive tier at the exact token boundary", () => {
    const pricing = { ...base, tier };
    expect(resolveEffectivePricing(pricing, 199999).output).toBe(6);
    expect(resolveEffectivePricing(pricing, 200000)).toMatchObject({ input: 4, output: 12, reasoning: 12 });
    expect(resolveEffectivePricing(pricing, 200001).output).toBe(12);
    const tokens = { prompt_tokens: 200000, completion_tokens: 10000, reasoning_tokens: 6000 };
    expect(calculateCostFromTokens(tokens, pricing)).toBeCloseTo(0.92, 8);
    expect(calculateCostBreakdown(tokens, pricing).totalCost).toBeCloseTo(0.92, 8);
  });
  it("keeps existing exclusive threshold semantics unless inclusive is explicitly true", () => {
    for (const inclusive of [undefined, false, "true"]) {
      const pricing = { ...base, tier: { ...tier, inclusive } };
      expect(resolveEffectivePricing(pricing, 200000).output).toBe(6);
      expect(resolveEffectivePricing(pricing, 200001).output).toBe(12);
    }
  });
});
