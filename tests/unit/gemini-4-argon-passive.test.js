import { describe, expect, it } from "vitest";
import { getCapabilitiesForModel, setCatalogSource } from "../../open-sse/providers/capabilities.js";
import { getPricingForModel } from "../../open-sse/providers/pricing.js";

setCatalogSource(null);

describe("Gemini 4 Argon passive foundation", () => {
  it("resolves gemini-4-argon with 1M context, 1M max output tokens, and full multimodality", () => {
    for (const id of ["gemini-4-argon", "gemini-4-argon-preview", "gemini-4"]) {
      const caps = getCapabilitiesForModel("gemini", id);
      expect(caps).toMatchObject({
        contextWindow: 1048576,
        maxOutput: 1000000,
        vision: true,
        pdf: true,
        audioInput: true,
        videoInput: true,
        reasoning: true,
        search: true,
        tools: true,
        thinkingFormat: "gemini-level",
      });
    }
  });

  it("prices gemini-4-argon at official introductory $2.00 / $10.00 with 95% cached discount ($0.10)", () => {
    const p = getPricingForModel("gemini", "gemini-4-argon");
    expect(p).toMatchObject({
      input: 2.0,
      output: 10.0,
      cached: 0.1,
    });
  });
});
