import { describe, expect, it } from "vitest";
import { adjustMaxTokens, requiresMaxCompletionTokens } from "../../open-sse/translator/formats/maxTokens.js";
import { DEFAULT_MAX_TOKENS, DEFAULT_MIN_TOKENS, REASONING_MIN_OUTPUT_FLOOR } from "../../open-sse/config/runtimeConfig.js";

describe("Dynamic Reasoning Budget Auto-Adjustment", () => {
  it("defines token output limits and reasoning floor", () => {
    expect(DEFAULT_MAX_TOKENS).toBe(64000);
    expect(DEFAULT_MIN_TOKENS).toBe(32000);
    expect(REASONING_MIN_OUTPUT_FLOOR).toBe(65536);
  });

  it("automatically bumps low client max_tokens to 65536 when reasoning_effort is high", () => {
    const body = {
      model: "deepseek-r1",
      reasoning_effort: "high",
      max_tokens: 1000 // Too small for high reasoning!
    };
    const adjusted = adjustMaxTokens(body, 65536);
    expect(adjusted).toBe(65536);
  });

  it("automatically bumps low client max_tokens to 65536 when reasoning_effort is max or ultra", () => {
    const bodyMax = {
      model: "gpt-6-sol",
      reasoning_effort: "max",
      max_tokens: 2048
    };
    expect(adjustMaxTokens(bodyMax, 128000)).toBe(65536);

    const bodyUltra = {
      model: "codex/gpt-5.6-sol",
      output_config: { effort: "ultra" },
      max_tokens: 4000
    };
    expect(adjustMaxTokens(bodyUltra, 128000)).toBe(65536);
  });

  it("automatically bumps low client max_tokens when thinking is enabled or adaptive", () => {
    const bodyEnabled = {
      model: "claude-3-7-sonnet",
      thinking: { type: "enabled" },
      max_tokens: 1500
    };
    expect(adjustMaxTokens(bodyEnabled, 65536)).toBe(65536);

    const bodyAdaptive = {
      model: "claude-sonnet-4-6",
      thinking: { type: "adaptive" },
      max_tokens: 2000
    };
    expect(adjustMaxTokens(bodyAdaptive, 128000)).toBe(65536);
  });

  it("preserves higher client max_tokens above the reasoning floor up to ceiling", () => {
    const body = {
      model: "claude-sonnet-5",
      reasoning_effort: "high",
      max_tokens: 100000
    };
    expect(adjustMaxTokens(body, 128000)).toBe(100000);
  });

  it("clamps to ceiling when ceiling is lower than the reasoning floor", () => {
    const body = {
      model: "legacy-low-cap-model",
      reasoning_effort: "high",
      max_tokens: 1000
    };
    // If a model has ceiling 32768, bump up to ceiling
    expect(adjustMaxTokens(body, 32768)).toBe(32768);
  });

  it("ensures max_tokens exceeds thinking.budget_tokens with headroom", () => {
    const body = {
      model: "claude-3-7-sonnet",
      thinking: { type: "enabled", budget_tokens: 32000 },
      max_tokens: 30000
    };
    const adjusted = adjustMaxTokens(body, 65536);
    expect(adjusted).toBeGreaterThan(body.thinking.budget_tokens);
    expect(adjusted).toBe(65536);
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
