import { describe, expect, it } from "vitest";
import { adjustMaxTokens, requiresMaxCompletionTokens } from "../../open-sse/translator/formats/maxTokens.js";
import { DEFAULT_MAX_TOKENS, DEFAULT_MIN_TOKENS, REASONING_MIN_OUTPUT_FLOOR } from "../../open-sse/config/runtimeConfig.js";

// Explicit caps are ceilings, not requests for automatic reasoning headroom.
describe("Reasoning output budget preservation", () => {
  it("defines token output limits and reasoning floor", () => {
    expect(DEFAULT_MAX_TOKENS).toBe(64000);
    expect(DEFAULT_MIN_TOKENS).toBe(32000);
    expect(REASONING_MIN_OUTPUT_FLOOR).toBe(65536);
  });

  it("preserves low client max_tokens when reasoning_effort is high", () => {
    const body = {
      model: "deepseek-r1",
      reasoning_effort: "high",
      max_tokens: 1000 // May truncate; never silently authorize more output.
    };
    const adjusted = adjustMaxTokens(body, 65536);
    expect(adjusted).toBe(body.max_tokens);
  });

  it("preserves low client max_tokens when reasoning_effort is max or ultra", () => {
    const bodyMax = {
      model: "gpt-6-sol",
      reasoning_effort: "max",
      max_tokens: 2048
    };
    expect(adjustMaxTokens(bodyMax, 128000)).toBe(2048);

    const bodyUltra = {
      model: "codex/gpt-5.6-sol",
      output_config: { effort: "ultra" },
      max_tokens: 4000
    };
    expect(adjustMaxTokens(bodyUltra, 128000)).toBe(4000);
  });

  it("preserves low client max_tokens when thinking is enabled or adaptive", () => {
    const bodyEnabled = {
      model: "claude-3-7-sonnet",
      thinking: { type: "enabled" },
      max_tokens: 1500
    };
    expect(adjustMaxTokens(bodyEnabled, 65536)).toBe(1500);

    const bodyAdaptive = {
      model: "claude-sonnet-4-6",
      thinking: { type: "adaptive" },
      max_tokens: 2000
    };
    expect(adjustMaxTokens(bodyAdaptive, 128000)).toBe(2000);
  });

  it("preserves higher client max_tokens above the reasoning floor up to ceiling", () => {
    const body = {
      model: "claude-sonnet-5",
      reasoning_effort: "high",
      max_tokens: 100000
    };
    expect(adjustMaxTokens(body, 128000)).toBe(100000);
  });

  it("does not turn a lower ceiling into a minimum", () => {
    const body = {
      model: "legacy-low-cap-model",
      reasoning_effort: "high",
      max_tokens: 1000
    };
    // A model ceiling can only reduce the requested output, never raise it.
    expect(adjustMaxTokens(body, 32768)).toBe(1000);
  });

  it("leaves reconciliation to the reasoning codec instead of increasing output", () => {
    const body = {
      model: "claude-3-7-sonnet",
      thinking: { type: "enabled", budget_tokens: 32000 },
      max_tokens: 30000
    };
    const adjusted = adjustMaxTokens(body, 65536);
    expect(adjusted).toBeLessThan(body.thinking.budget_tokens);
    expect(adjusted).toBe(body.max_tokens);
  });

  it("identifies both gpt-5 and gpt-6 as requiring max_completion_tokens", () => {
    expect(requiresMaxCompletionTokens("gpt-5")).toBe(true);
    expect(requiresMaxCompletionTokens("gpt-5.6-sol")).toBe(true);
    expect(requiresMaxCompletionTokens("gpt-6")).toBe(true);
    expect(requiresMaxCompletionTokens("gpt-6.1-sol")).toBe(true);
    expect(requiresMaxCompletionTokens("o1-mini")).toBe(true);
    expect(requiresMaxCompletionTokens("o3-mini")).toBe(true);
    expect(requiresMaxCompletionTokens("gpt-4o")).toBe(false);
    expect(requiresMaxCompletionTokens("claude-sonnet-4-6")).toBe(false);
  });
});
