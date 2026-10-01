import { describe, expect, it } from "vitest";
import {
  getCapabilitiesForModel,
  setCatalogSource,
} from "../../open-sse/providers/capabilities.js";

setCatalogSource(null);

// Gemini accepts PDF documents as native input on the 2.5 and 3.x generations
// (ai.google.dev/gemini-api/docs/document-processing). Reporting pdf:false made
// stripUnsupportedModalities() delete the document and replace it with a text
// placeholder before the request ever left the gateway.
describe("document (pdf) capability", () => {
  const pdfModels = [
    ["gemini", "gemini-3.8-flash"],
    ["gemini", "gemini-3.5-flash-lite"],
    ["gemini-cli", "gemini-2.5-pro"],
    ["gemini-cli", "gemini-3.1-pro-preview"],
    ["vertex", "gemini-2.5-flash"],
    ["antigravity", "gemini-3.8-flash-high"],
    ["antigravity", "gemini-3.7-flash-medium"],
    ["antigravity", "gemini-3.6-flash-low"],
  ];

  it("is reported for Gemini 2.5 and 3.x models on every transport", () => {
    for (const [provider, model] of pdfModels) {
      expect({ provider, model, pdf: getCapabilitiesForModel(provider, model).pdf })
        .toMatchObject({ pdf: true });
    }
  });

  it("does not leak onto Gemma (a separate, text-and-image family)", () => {
    expect(getCapabilitiesForModel("gemini", "gemma-4-31b-it").pdf).toBe(false);
  });

  it("leaves the other Gemini modalities intact", () => {
    expect(getCapabilitiesForModel("gemini", "gemini-3.8-flash")).toMatchObject({
      vision: true,
      audioInput: true,
      videoInput: true,
      reasoning: true,
      search: true,
    });
  });
});