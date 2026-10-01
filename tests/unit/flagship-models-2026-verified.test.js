import { describe, expect, it } from "vitest";
import { getCapabilitiesForModel, setCatalogSource } from "../../open-sse/providers/capabilities.js";
import { getPricingForModel } from "../../open-sse/providers/pricing.js";
import { supportsGrokCliReasoningEffort } from "../../open-sse/config/grokCli.js";

setCatalogSource(null);

describe("verified specs for flagship 2026 models", () => {
  it("resolves gpt-6.1-sol capabilities and pricing correctly", () => {
    const caps = getCapabilitiesForModel("openai", "gpt-6.1-sol");
    expect(caps).toMatchObject({
      contextWindow: 1050000,
      maxOutput: 128000,
      vision: true,
      pdf: true,
      reasoning: true,
    });
    const pricing = getPricingForModel("openai", "gpt-6.1-sol");
    expect(pricing).toMatchObject({
      input: 2.0,
      output: 10.0,
      cached: 0.1,
      cache_creation: 2.5,
    });
  });

  it("resolves Grok 4.7 with 500k context, 500k output, and reasoning effort support", () => {
    const caps = getCapabilitiesForModel("xai", "grok-4.7");
    expect(caps).toMatchObject({
      contextWindow: 500000,
      maxOutput: 500000,
      vision: true,
      pdf: true,
      reasoning: true,
    });
    expect(supportsGrokCliReasoningEffort("grok-4.7")).toBe(true);
    const p = getPricingForModel("xai", "grok-4.7");
    expect(p).toMatchObject({
      input: 2.0,
      output: 6.0,
      cached: 0.5,
    });
  });

  it("resolves Grok 4.3 with 1M context, 30k output, and pdf support", () => {
    const caps = getCapabilitiesForModel("xai", "grok-4.3");
    expect(caps).toMatchObject({
      contextWindow: 1000000,
      maxOutput: 30000,
      vision: true,
      pdf: true,
      reasoning: true,
    });
  });

  it("prices Gemini 3.8/3.7/3.6 Flash at official 2026 schedule ($0.75/$3.75)", () => {
    for (const model of ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash"]) {
      const p = getPricingForModel("gemini", model);
      expect(p).toMatchObject({
        input: 0.75,
        output: 3.75,
        cached: 0.075,
      });
    }
  });

  it("prices Gemini 3.1 Pro Preview at official $2/$12 ($0.20 cache read)", () => {
    const p = getPricingForModel("gemini", "gemini-3.1-pro-preview");
    expect(p).toMatchObject({
      input: 2.0,
      output: 12.0,
      cached: 0.2,
    });
  });

  it("resolves Codex models with vision and corrected context limits", () => {
    const spark = getCapabilitiesForModel("codex", "gpt-5.3-codex-spark");
    expect(spark).toMatchObject({
      vision: true,
      pdf: true,
      contextWindow: 128000,
      maxOutput: 32000,
    });
    const mini = getCapabilitiesForModel("openai", "gpt-5.4-mini");
    expect(mini.contextWindow).toBe(400000);
  });
});
