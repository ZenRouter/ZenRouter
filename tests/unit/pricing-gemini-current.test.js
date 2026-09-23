import { describe, it, expect } from "vitest";
import { MODEL_PRICING, getPricingForModel } from "../../open-sse/providers/pricing.js";
import { getCapabilitiesForModel } from "../../open-sse/providers/capabilities.js";
import geminiRegistry from "../../open-sse/providers/registry/gemini.js";
import geminiCliRegistry from "../../open-sse/providers/registry/gemini-cli.js";
import vertexRegistry from "../../open-sse/providers/registry/vertex.js";

// Official Gemini pricing + deprecations (ai.google.dev/gemini-api/docs/{pricing,deprecations}, snapshot 2026-09-23).
describe("Gemini current pricing", () => {
  it("prices gemini-2.5-pro at 1.25/10 (not stale 2/12)", () => {
    expect(getPricingForModel("gemini", "gemini-2.5-pro")).toMatchObject({ input: 1.25, output: 10 });
  });
  it("prices gemini-2.5-flash-lite at 0.10/0.40 after the cut", () => {
    expect(getPricingForModel("gemini", "gemini-2.5-flash-lite")).toMatchObject({ input: 0.1, output: 0.4 });
  });
  it("prices gemini-3.5-flash at 1.50/9.00 and 3.1-flash-lite at 0.25/1.50", () => {
    expect(getPricingForModel("gemini", "gemini-3.5-flash")).toMatchObject({ input: 1.5, output: 9 });
    expect(getPricingForModel("gemini", "gemini-3.1-flash-lite")).toMatchObject({ input: 0.25, output: 1.5 });
  });
  it("has an embedding price for gemini-embedding-001", () => {
    expect(MODEL_PRICING["gemini-embedding-001"].input).toBe(0.15);
  });
});

describe("Gemini registry lineup", () => {
  const ids = geminiRegistry.models.map((m) => m.id);
  it("lists current GA models and stable image IDs", () => {
    for (const id of ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.1-flash-image", "gemini-3-pro-image"]) {
      expect(ids).toContain(id);
    }
  });
  it("removed retired previews and PaLM leftovers", () => {
    for (const id of [
      "gemini-3-pro-preview",
      "gemini-3.1-flash-lite-preview",
      "gemini-3.1-flash-image-preview",
      "gemini-3-pro-image-preview",
      "text-embedding-004",
      "embedding-001",
      "gemini-2.0-flash",
    ]) {
      expect(ids).not.toContain(id);
    }
  });
  it("gemini-cli and vertex dropped the retired previews too", () => {
    const cli = geminiCliRegistry.models.map((m) => m.id);
    const vtx = vertexRegistry.models.map((m) => m.id);
    expect(cli).not.toContain("gemini-3-pro-preview");
    expect(cli).not.toContain("gemini-3.1-flash-lite-preview");
    expect(vtx).not.toContain("gemini-3.1-flash-lite-preview");
    expect(vtx).toContain("gemini-3.5-flash");
  });
});

describe("Gemini capability corrections", () => {
  it("gives image models the 128K class context, not 1M", () => {
    expect(getCapabilitiesForModel("gemini", "gemini-3.1-flash-image").contextWindow).toBe(131072);
  });
  it("gives Gemma 4 31B 256K context", () => {
    expect(getCapabilitiesForModel("gemini", "gemma-4-31b-it").contextWindow).toBe(256000);
  });
});
