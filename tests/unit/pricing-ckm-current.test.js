import { describe, it, expect } from "vitest";
import { MODEL_PRICING, getPricingForModel } from "../../open-sse/providers/pricing.js";
import kimiRegistry from "../../open-sse/providers/registry/kimi.js";
import minimaxRegistry from "../../open-sse/providers/registry/minimax.js";
import glmRegistry from "../../open-sse/providers/registry/glm.js";

// Official schedules (snapshot 2026-09-23): platform.kimi.ai, platform.minimax.io, docs.z.ai.
describe("Kimi current lineup", () => {
  const ids = kimiRegistry.models.map((m) => m.id);
  it("dropped discontinued k2.5/thinking/latest IDs", () => {
    for (const id of ["kimi-k2.5", "kimi-k2.5-thinking", "kimi-latest", "kimi-k2", "kimi-k2-thinking"]) {
      expect(ids).not.toContain(id);
      expect(MODEL_PRICING[id]).toBeUndefined();
    }
  });
  it("prices k2.6 with the official $0.16 cache-hit rate", () => {
    expect(getPricingForModel("kimi", "kimi-k2.6")).toMatchObject({ input: 0.95, output: 4, cached: 0.16 });
  });
});

describe("MiniMax current pricing", () => {
  it("prices M2.x at 0.30/1.20 with per-model cache-hit rates", () => {
    expect(getPricingForModel("minimax", "MiniMax-M2.7")).toMatchObject({ input: 0.3, output: 1.2, cached: 0.06 });
    expect(getPricingForModel("minimax", "MiniMax-M2.5")).toMatchObject({ input: 0.3, output: 1.2, cached: 0.03 });
    expect(getPricingForModel("minimax", "MiniMax-M2.1")).toMatchObject({ input: 0.3, output: 1.2, cached: 0.03 });
  });
  it("lists base M2 plus highspeed variants", () => {
    const ids = minimaxRegistry.models.map((m) => m.id);
    for (const id of ["MiniMax-M2", "MiniMax-M2.7-highspeed", "MiniMax-M2.5-highspeed", "MiniMax-M2.1-highspeed"]) {
      expect(ids).toContain(id);
    }
  });
});

describe("GLM current pricing", () => {
  it("prices the 5.x family at the official z.ai schedule", () => {
    expect(getPricingForModel("glm", "glm-5.3")).toMatchObject({ input: 1.4, output: 4.4, cached: 0.26 });
    expect(getPricingForModel("glm", "glm-5.3-flash")).toMatchObject({ input: 0.15, output: 0.5 });
    expect(getPricingForModel("glm", "glm-5.2")).toMatchObject({ input: 1.4, output: 4.4 });
    expect(getPricingForModel("glm", "glm-5.1")).toMatchObject({ input: 1.4, output: 4.4 });
    expect(getPricingForModel("glm", "glm-5")).toMatchObject({ input: 1, output: 3.2 });
  });
  it("prices the 4.x family and new variants", () => {
    expect(getPricingForModel("glm", "glm-4.7")).toMatchObject({ input: 0.6, output: 2.2 });
    expect(getPricingForModel("glm", "glm-4.6v")).toMatchObject({ input: 0.3, output: 0.9 });
    expect(getPricingForModel("glm", "glm-4.5-air")).toMatchObject({ input: 0.2, output: 1.1 });
    expect(getPricingForModel("glm", "glm-5.3-flashx")).toMatchObject({ input: 0.37, output: 1.25 });
  });
  it("lists the new variants in the registry", () => {
    const ids = glmRegistry.models.map((m) => m.id);
    for (const id of ["glm-5.3-flashx", "glm-5-turbo", "glm-4.7-flash", "glm-4.7-flashx", "glm-4.5", "glm-4.5v", "glm-4.6v-flashx"]) {
      expect(ids).toContain(id);
    }
  });
});
