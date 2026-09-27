import { describe, expect, it } from "vitest";
import { getCapabilitiesForModel } from "../../open-sse/providers/capabilities.js";

describe("getCapabilitiesForModel", () => {
  const claudeSonnet5Expected = {
    contextWindow: 1000000,
    maxOutput: 128000,
    thinkingFormat: "claude-adaptive",
    reasoning: true,
    vision: true,
    search: true,
    pdf: true,
    tools: true,
  };

  const kiroGpt56Expected = {
    contextWindow: 272000,
    maxOutput: 128000,
    thinkingFormat: "openai",
    reasoning: true,
    vision: true,
    search: true,
  };

  it("reports Kiro Claude Opus 5 variants as 1M adaptive-thinking models", () => {
    for (const model of [
      "claude-opus-5",
      "anthropic/claude-opus-5",
      "claude-opus-5-thinking",
      "claude-opus-5-agentic",
      "claude-opus-5-thinking-agentic",
    ]) {
      expect(getCapabilitiesForModel("kiro", model)).toMatchObject(claudeSonnet5Expected);
    }
  });

  it("reports Claude Opus 5.5 variants as permanent adaptive-thinking 1M models", () => {
    for (const model of [
      "claude-opus-5-5",
      "anthropic/claude-opus-5-5",
      "claude-opus-5.5",
      "claude-opus-5-5-thinking",
      "claude-opus-5-5-agentic",
      "claude-opus-5-5-thinking-agentic",
    ]) {
      expect(getCapabilitiesForModel("claude", model)).toMatchObject({
        ...claudeSonnet5Expected,
        thinkingCanDisable: false,
      });
    }
  });

  it("reports Claude Fable 5.1 as a permanent adaptive-thinking model", () => {
    expect(getCapabilitiesForModel("claude", "claude-fable-5-1")).toMatchObject({
      ...claudeSonnet5Expected,
      thinkingCanDisable: false,
    });
  });

  it("reports Kiro Claude Opus 4.8 as a 1M context model", () => {
    expect(getCapabilitiesForModel("kiro", "claude-opus-4.8").contextWindow).toBe(1000000);
    expect(getCapabilitiesForModel("kiro", "anthropic/claude-opus-4.8").contextWindow).toBe(1000000);
    expect(getCapabilitiesForModel("kiro", "claude-opus-4-8").contextWindow).toBe(1000000);
    expect(getCapabilitiesForModel("kiro", "claude-opus-4.8-thinking").contextWindow).toBe(1000000);
    expect(getCapabilitiesForModel("kiro", "claude-opus-4-8-thinking").contextWindow).toBe(1000000);
  });

  it("reports Kiro Claude Sonnet 5 as a 1M adaptive-thinking model", () => {
    expect(getCapabilitiesForModel("kiro", "claude-sonnet-5")).toMatchObject(claudeSonnet5Expected);
    expect(getCapabilitiesForModel("kiro", "anthropic/claude-sonnet-5")).toMatchObject(claudeSonnet5Expected);
    expect(getCapabilitiesForModel("kiro", "claude-sonnet-5-thinking")).toMatchObject(claudeSonnet5Expected);
    expect(getCapabilitiesForModel("kiro", "claude-sonnet-5-agentic")).toMatchObject(claudeSonnet5Expected);
    expect(getCapabilitiesForModel("kiro", "claude-sonnet-5-thinking-agentic")).toMatchObject(claudeSonnet5Expected);
  });

  it("reports Kiro GPT 5.6 models with the Kiro 272k context window", () => {
    expect(getCapabilitiesForModel("kiro", "gpt-5.6-sol")).toMatchObject(kiroGpt56Expected);
    expect(getCapabilitiesForModel("kiro", "openai/gpt-5.6-sol")).toMatchObject(kiroGpt56Expected);
    expect(getCapabilitiesForModel("kiro", "gpt-5.6-terra-thinking")).toMatchObject(kiroGpt56Expected);
    expect(getCapabilitiesForModel("kiro", "gpt-5.6-luna-agentic")).toMatchObject(kiroGpt56Expected);
    expect(getCapabilitiesForModel("kiro", "gpt-5.6-sol-thinking-agentic")).toMatchObject(kiroGpt56Expected);
  });

  it("reports GPT-6 Astra, Sol, and Luna with official 1.05M context / 128k output limits", () => {
    const expected = {
      contextWindow: 1050000,
      maxOutput: 128000,
      thinkingFormat: "openai",
      reasoning: true,
      vision: true,
      search: true,
    };
    for (const model of ["gpt-6-astra", "openai/gpt-6-astra", "gpt-6-sol", "gpt-6-luna"]) {
      expect(getCapabilitiesForModel("codex", model)).toMatchObject(expected);
    }
  });

  it("reports Qwen 3.8 Max and Flash with multimodal reasoning capabilities", () => {
    const maxCaps = getCapabilitiesForModel("qwen", "qwen3.8-max");
    expect(maxCaps.contextWindow).toBe(1000000);
    expect(maxCaps.reasoning).toBe(true);
    expect(maxCaps.thinkingCanDisable).toBe(false);

    const flashCaps = getCapabilitiesForModel("qwen", "qwen3.8-flash");
    expect(flashCaps.contextWindow).toBe(1000000);
    expect(flashCaps.vision).toBe(true);
    expect(flashCaps.videoInput).toBe(true);
    expect(flashCaps.reasoning).toBe(true);
  });

  it("reports DeepSeek V4.1 Flash with 1M context and vision", () => {
    const caps = getCapabilitiesForModel("deepseek", "deepseek-v4.1-flash");
    expect(caps.contextWindow).toBe(1000000);
    expect(caps.maxOutput).toBe(384000);
    expect(caps.vision).toBe(true);
    expect(caps.reasoning).toBe(true);
  });
});
