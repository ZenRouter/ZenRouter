import { describe, expect, it } from "vitest";
import { MODEL_PRICING, calculateCostFromTokens, calculateCostBreakdown, resolveEffectivePricing } from "../../open-sse/providers/pricing.js";

describe("tiered reasoning metadata", () => {
  it("bills reasoning at tier output when base reasoning is output-billed across every declared tier", () => {
    for (const pricing of Object.values(MODEL_PRICING)) {
      if (!pricing.tier || pricing.reasoning !== pricing.output) continue;
      expect(resolveEffectivePricing(pricing, pricing.tier.threshold)).toBe(pricing);
      expect(resolveEffectivePricing(pricing, pricing.tier.threshold + 1).reasoning).toBe(pricing.tier.reasoning ?? pricing.tier.output);
      for (const reasoning of [0, 15000, 20000]) {
        const tokens = { prompt_tokens: pricing.tier.threshold + 1, cached_tokens: 10000, completion_tokens: 20000, reasoning_tokens: reasoning };
        const effective = resolveEffectivePricing(pricing, tokens.prompt_tokens);
        const expected = ((tokens.prompt_tokens - 10000) * effective.input + 10000 * effective.cached + (20000 - reasoning) * effective.output + reasoning * effective.reasoning) / 1e6;
        const breakdown = calculateCostBreakdown(tokens, pricing);
        expect(calculateCostFromTokens(tokens, pricing)).toBeCloseTo(expected, 10);
        expect(breakdown.totalCost).toBeCloseTo(expected, 10);
        expect(breakdown.reasoningCost).toBeCloseTo(reasoning * effective.reasoning / 1e6, 10);
      }
    }
  });
  it("preserves distinct base and explicit tier reasoning, including zero, without mutation", () => {
    for (const [reasoning, tierReasoning, expected] of [[undefined, undefined, 8], [4, undefined, 8], [7, undefined, 7], [4, 9, 9], [7, 0, 0]]) {
      const pricing = { input: 1, output: 4, ...(reasoning === undefined ? {} : { reasoning }), tier: { threshold: 10, output: 8, ...(tierReasoning === undefined ? {} : { reasoning: tierReasoning }) } };
      const before = structuredClone(pricing);
      expect(resolveEffectivePricing(pricing, 11).reasoning).toBe(expected);
      const usage = { prompt_tokens: 11, completion_tokens: 6, reasoning_tokens: 4 };
      const cost = (11 + 2 * 8 + 4 * expected) / 1e6;
      expect(calculateCostFromTokens(usage, pricing)).toBeCloseTo(cost, 12);
      expect(calculateCostBreakdown(usage, pricing).totalCost).toBeCloseTo(cost, 12);
      expect(pricing).toEqual(before);
    }
  });
});
