import { describe, it, expect } from "vitest";
import { ANTIGRAVITY_PROMPT_REWRITES } from "../../open-sse/config/appConstants.js";

function applyRewrites(text) {
  let result = text;
  for (const { from, to } of ANTIGRAVITY_PROMPT_REWRITES) {
    result = result.replaceAll(from, to);
  }
  return result;
}

describe("Antigravity prompt rewriting (#4138)", () => {
  it("strips Claude Code billing header when it is the first line", () => {
    const prompt = "x-anthropic-billing-header: cc_version=2.1.275.f15; cc_entrypoint=cli;\nYou are Claude Code, Anthropic's official CLI for Claude.";
    const cleaned = applyRewrites(prompt);
    expect(cleaned).not.toContain("x-anthropic-billing-header");
    expect(cleaned).toBe("You are Claude Code, Anthropic's official CLI for Claude.");
  });

  it("strips Claude Code billing header on later lines", () => {
    const prompt = "System instructions line 1\nx-anthropic-billing-header: cc_version=2.1.275.f15; cc_entrypoint=cli;\nSystem instructions line 2";
    const cleaned = applyRewrites(prompt);
    expect(cleaned).not.toContain("x-anthropic-billing-header");
    expect(cleaned).toBe("System instructions line 1\nSystem instructions line 2");
  });

  it("leaves prompt without billing header untouched", () => {
    const prompt = "You are a helpful assistant.";
    const cleaned = applyRewrites(prompt);
    expect(cleaned).toBe("You are a helpful assistant.");
  });
});
