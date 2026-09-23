import { describe, it, expect } from "vitest";
import { MODEL_PRICING, getPricingForModel } from "../../open-sse/providers/pricing.js";
import { getCapabilitiesForModel } from "../../open-sse/providers/capabilities.js";
import xaiRegistry from "../../open-sse/providers/registry/xai.js";
import deepseekRegistry from "../../open-sse/providers/registry/deepseek.js";
import mistralRegistry from "../../open-sse/providers/registry/mistral.js";

describe("xAI current lineup", () => {
  const ids = xaiRegistry.models.map((m) => m.id);
  it("lists Grok 4.7/4.3/Build and drops retired IDs", () => {
    for (const id of ["grok-4.7", "grok-4.3", "grok-build-0.1"]) expect(ids).toContain(id);
    for (const id of ["grok-3", "grok-4-fast-reasoning", "grok-code-fast-1", "grok-2-image-1212"]) {
      expect(ids).not.toContain(id);
    }
  });
  it("prices current Grok models off exact entries", () => {
    expect(getPricingForModel("xai", "grok-4.6")).toMatchObject({ input: 2, output: 6 });
    expect(getPricingForModel("xai", "grok-4.3")).toMatchObject({ input: 1.25, output: 2.5 });
  });
  it("grok-4.6 pattern carries no fabricated maxOutput cap", async () => {
    const mod = await import("../../open-sse/providers/capabilities.js");
    const entry = mod.PATTERN_CAPABILITIES.find((e) => e.pattern === "*grok-4.6*");
    expect(entry).toBeDefined();
    expect(entry.caps.contextWindow).toBe(500000);
    expect("maxOutput" in entry.caps).toBe(false);
  });
});

describe("DeepSeek current lineup", () => {
  const ids = deepseekRegistry.models.map((m) => m.id);
  it("dropped discontinued chat/reasoner and retired vision-exp IDs", () => {
    for (const id of ["deepseek-chat", "deepseek-reasoner", "deepseek-v4-flash-vision-exp"]) {
      expect(ids).not.toContain(id);
    }
    expect(ids).toContain("deepseek-flash");
    expect(ids).toContain("deepseek-v4-pro");
  });
  it("prices flash/pro at the official off-peak schedule", () => {
    expect(getPricingForModel("deepseek", "deepseek-flash")).toMatchObject({ input: 0.15, output: 0.6 });
    expect(getPricingForModel("deepseek", "deepseek-v4-pro")).toMatchObject({ input: 0.66, output: 1.98 });
  });
  it("caps v4-pro/v4-flash maxOutput at 384K", () => {
    expect(getCapabilitiesForModel("deepseek", "deepseek-v4-pro").maxOutput).toBe(384000);
  });
});

describe("Mistral current lineup", () => {
  const ids = mistralRegistry.models.map((m) => m.id);
  it("lists Small 4 and labels Medium 3.5", () => {
    expect(ids).toContain("mistral-small-latest");
    expect(mistralRegistry.models.find((m) => m.id === "mistral-medium-latest").name).toContain("3.5");
  });
  it("prices the -latest slugs", () => {
    expect(getPricingForModel("mistral", "mistral-large-latest")).toMatchObject({ input: 0.5, output: 1.5 });
    expect(getPricingForModel("mistral", "mistral-small-latest")).toMatchObject({ input: 0.15, output: 0.6 });
    expect(getPricingForModel("mistral", "codestral-latest")).toMatchObject({ input: 0.3, output: 0.9 });
  });
  it("caps codestral at 128K", () => {
    expect(getCapabilitiesForModel("mistral", "codestral-latest").contextWindow).toBe(128000);
  });
});
