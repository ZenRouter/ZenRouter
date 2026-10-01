import { describe, expect, it } from "vitest";
import { getCapabilitiesForModel, setCatalogSource } from "../../open-sse/providers/capabilities.js";
import { getPricingForModel } from "../../open-sse/providers/pricing.js";
import { CLAUDE_BETA_FLAGS_BASE } from "../../open-sse/config/clientVersions.js";

setCatalogSource(null);

describe("Claude Sonnet 5.5 and verified Claude capabilities", () => {
  it("resolves claude-sonnet-5-5 as 1M adaptive thinking model that rejects disabled thinking", () => {
    for (const id of [
      "claude-sonnet-5-5",
      "claude-sonnet-5.5",
      "claude-sonnet-5-5-thinking",
      "claude-sonnet-5-5-agentic",
    ]) {
      const caps = getCapabilitiesForModel("claude", id);
      expect(caps).toMatchObject({
        contextWindow: 1000000,
        maxOutput: 128000,
        thinkingFormat: "claude-adaptive",
        thinkingCanDisable: false,
        vision: true,
        pdf: true,
        tools: true,
        search: true,
      });
    }
  });

  it("prices claude-sonnet-5-5 at $2/$10 with $0.20 cache read and $2.50 cache write", () => {
    const p = getPricingForModel("claude", "claude-sonnet-5-5");
    expect(p).toMatchObject({
      input: 2.0,
      output: 10.0,
      cached: 0.2,
      cache_creation: 2.5,
    });
  });

  it("prices claude-fable-5-1 cache read at $0.25 (0.025x input)", () => {
    const p = getPricingForModel("claude", "claude-fable-5-1");
    expect(p.cached).toBe(0.25);
  });

  it("marks claude-fable-5 as unable to disable thinking", () => {
    expect(getCapabilitiesForModel("claude", "claude-fable-5").thinkingCanDisable).toBe(false);
  });

  it("does not include the non-existent token-efficient-tools-2026-03-28 beta flag", () => {
    expect(CLAUDE_BETA_FLAGS_BASE).not.toContain("token-efficient-tools-2026-03-28");
  });
});
