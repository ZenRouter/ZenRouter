import { describe, expect, it } from "vitest";
import { calculateCostFromTokens, calculateCostBreakdown, getPricingForModel } from "../../open-sse/providers/pricing.js";

describe("tiered / long-context pricing calculation", () => {
  it("calculates standard base cost when input tokens are below tier threshold", () => {
    const pricing = getPricingForModel("openai", "gpt-6-astra");
    expect(pricing.tier).toBeDefined();
    expect(pricing.tier.threshold).toBe(272000);

    // 100k input, 10k output, 50k cached
    const tokens = {
      prompt_tokens: 100000,
      cached_tokens: 50000,
      completion_tokens: 10000,
    };
    // Base: nonCached = 50k * ($10/M) = $0.50
    // Cached: 50k * ($1/M) = $0.05
    // Output: 10k * ($50/M) = $0.50
    // Total = $1.05
    const cost = calculateCostFromTokens(tokens, pricing);
    expect(cost).toBeCloseTo(1.05, 4);

    const breakdown = calculateCostBreakdown(tokens, pricing);
    expect(breakdown.inputCost).toBeCloseTo(0.50, 4);
    expect(breakdown.cachedCost).toBeCloseTo(0.05, 4);
    expect(breakdown.outputCost).toBeCloseTo(0.50, 4);
    expect(breakdown.totalCost).toBeCloseTo(1.05, 4);
  });

  it("applies long-context tier rates when prompt tokens exceed 272k on GPT-6 Astra", () => {
    const pricing = getPricingForModel("openai", "gpt-6-astra");
    // 300k prompt tokens > 272k threshold
    // 100k cached tokens, 200k nonCached
    // 20k completion tokens
    const tokens = {
      prompt_tokens: 300000,
      cached_tokens: 100000,
      completion_tokens: 20000,
    };
    // Long-context tier for gpt-6-astra:
    // input: $20.00 / M
    // cached: $2.00 / M
    // output: $75.00 / M
    // nonCached = 200k * ($20/M) = $4.00
    // cached = 100k * ($2/M) = $0.20
    // output = 20k * ($75/M) = $1.50
    // Total = $5.70 (without tier it would be 200k*10 + 100k*1 + 20k*50 = $3.10)
    const cost = calculateCostFromTokens(tokens, pricing);
    expect(cost).toBeCloseTo(5.70, 4);

    const breakdown = calculateCostBreakdown(tokens, pricing);
    expect(breakdown.inputCost).toBeCloseTo(4.00, 4);
    expect(breakdown.cachedCost).toBeCloseTo(0.20, 4);
    expect(breakdown.outputCost).toBeCloseTo(1.50, 4);
    expect(breakdown.totalCost).toBeCloseTo(5.70, 4);
  });

  it("applies >200k tier on Gemini 3.1 Pro Preview", () => {
    const pricing = getPricingForModel("gemini", "gemini-3.1-pro-preview");
    expect(pricing.tier?.threshold).toBe(200000);

    const tokens = {
      prompt_tokens: 250000,
      completion_tokens: 10000,
    };
    // Tier (>200k): input $4.00/M, output $18.00/M
    // input = 250k * 4.00 = $1.00
    // output = 10k * 18.00 = $0.18
    // Total = $1.18
    const cost = calculateCostFromTokens(tokens, pricing);
    expect(cost).toBeCloseTo(1.18, 4);
  });
});
