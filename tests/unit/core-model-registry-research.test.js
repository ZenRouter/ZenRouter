import { describe, it, expect } from "vitest";
import openai from "../../open-sse/providers/registry/openai.js";
import anthropic from "../../open-sse/providers/registry/anthropic.js";
import codex from "../../open-sse/providers/registry/codex.js";
import gemini from "../../open-sse/providers/registry/gemini.js";
import grokCli from "../../open-sse/providers/registry/grok-cli.js";

const text = (provider) => provider.models.filter(m => !m.kind || m.kind === "llm");

describe("primary-evidence core text registry", () => {
  it("declares the missing API text IDs with Responses routing requirements", () => {
    for (const id of ["gpt-6.1-sol", "gpt-5.6-cyber", "gpt-5.3-codex"]) {
      expect(text(openai).find(m => m.id === id)).toMatchObject({
        id, targetFormat: "openai-responses", supportedFormats: ["openai-responses"],
      });
    }
    expect(openai.transports).toContainEqual(expect.objectContaining({
      format: "openai-responses", baseUrl: "https://api.openai.com/v1/responses",
    }));
  });

  it("adds the documented Fable API ID without guessing dated Opus snapshots", () => {
    expect(text(anthropic).map(m => m.id)).toContain("claude-fable-5");
    expect(text(anthropic).map(m => m.id)).not.toContain("claude-opus-5-5-20260922");
  });

  it("adds Google's documented custom-tools API endpoint without asserting CLI entitlement", () => {
    expect(text(gemini).map(m => m.id)).toContain("gemini-3.1-pro-preview-customtools");
  });

  it("does not advertise invented numeric Grok text output caps", () => {
    for (const id of ["grok-4.7", "grok-4.6", "grok-4.5"]) {
      expect(text(grokCli).find(m => m.id === id)).not.toHaveProperty("maxOutputTokens");
    }
  });

  it("keeps review entries as gateway aliases rather than native upstream IDs", () => {
    for (const m of text(codex).filter(m => m.id.endsWith("-review") && m.id !== "codex-auto-review")) {
      expect(m.upstreamModelId).toBe(m.id.replace(/-review$/, ""));
      expect(m.quotaFamily).toBe("review");
    }
  });
});
