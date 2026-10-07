// Regression: the Antigravity registry advertised five image models, but the
// provider's own model catalog (v1internal:fetchAvailableModels) exposes only
// `gemini-3.1-flash-image`. Requesting any of the others returns
// 404 NOT_FOUND "Requested entity was not found.", so they must not be
// advertised as usable image targets.
import { describe, it, expect } from "vitest";
import antigravity from "../../open-sse/providers/registry/antigravity.js";

const imageModels = () => antigravity.models.filter((m) => m.kind === "image").map((m) => m.id);

describe("Antigravity image model catalog", () => {
  it("advertises the model its live catalog actually serves", () => {
    expect(imageModels()).toContain("gemini-3.1-flash-image");
  });

  it("does not advertise image models absent from the live catalog", () => {
    // Verified 2026-10-07 against v1internal:fetchAvailableModels (27 models,
    // gemini-3.1-flash-image is the only image entry).
    for (const id of [
      "gemini-3-pro-image",
      "gemini-2.5-flash-image",
      "imagen-3.0-generate-002",
      "imagen-3.0-fast-generate-001",
    ]) {
      expect(imageModels()).not.toContain(id);
    }
  });

  it("keeps serviceKinds advertising image support", () => {
    expect(antigravity.serviceKinds).toContain("image");
  });
});