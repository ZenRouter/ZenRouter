import { describe, expect, it } from "vitest";
import "../../open-sse/translator/index.js";
import { readOutputTokenCap, adjustMaxTokens } from "../../open-sse/translator/formats/maxTokens.js";
import { openaiToGeminiRequest } from "../../open-sse/translator/request/openai-to-gemini.js";
import { claudeToOpenAIRequest } from "../../open-sse/translator/request/claude-to-openai.js";
import { claudeToKiroRequest } from "../../open-sse/translator/request/claude-to-kiro.js";
import { geminiToOpenAIRequest } from "../../open-sse/translator/request/gemini-to-openai.js";
import { antigravityToOpenAIRequest } from "../../open-sse/translator/request/antigravity-to-openai.js";
const messages = [{ role: "user", content: "hello" }];
describe("request review fix: nullable OpenAI caps", () => {
  it.each([
    [{ max_completion_tokens: null, max_tokens: 2000 }, 2000],
    [{ max_tokens: null }, undefined],
    [{ max_completion_tokens: null }, undefined],
    [{ max_completion_tokens: null, max_tokens: null }, undefined],
  ])("treats nullable OpenAI caps as unset: %j", (caps, expected) => {
    expect(readOutputTokenCap(caps)).toBe(expected);
    expect(openaiToGeminiRequest("gemini-2.5-flash", { messages, ...caps }, false).generationConfig.maxOutputTokens).toBe(expected);
    expect(adjustMaxTokens(caps)).toBe(expected ?? 64000);
  });
  it.each([0, -1, 1.5, NaN, Infinity, "2000"])("still rejects invalid OpenAI cap %s", value => {
    expect(() => readOutputTokenCap({ max_completion_tokens: value, max_tokens: 2000 })).toThrowError(expect.objectContaining({ code: "invalid_output_budget" }));
    expect(() => readOutputTokenCap({ max_completion_tokens: null, max_tokens: value })).toThrowError(expect.objectContaining({ code: "invalid_output_budget", param: "max_tokens" }));
  });
  it("does not treat arbitrary null-valued fields as omitted", () => {
    expect(() => readOutputTokenCap({ maxOutputTokens: null }, ["maxOutputTokens"]))
      .toThrowError(expect.objectContaining({ code: "invalid_output_budget" }));
  });
  it.each([
    ["Claude", () => claudeToOpenAIRequest("gpt-5.4", { messages, max_tokens: null }, false)],
    ["Claude/Kiro", () => claudeToKiroRequest("claude-sonnet-4.5", { messages, max_tokens: null }, false, {})],
    ["Gemini", () => geminiToOpenAIRequest("gpt-5.4", { generationConfig: { maxOutputTokens: null } }, false)],
    ["Antigravity", () => antigravityToOpenAIRequest("gpt-5.4", { request: { generationConfig: { maxOutputTokens: null } } }, false)],
  ])("does not extend nullable semantics to native %s", (_name, convert) => {
    expect(convert).toThrowError(expect.objectContaining({ code: "invalid_output_budget" }));
  });
});
