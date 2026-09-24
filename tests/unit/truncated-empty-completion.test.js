import { describe, it, expect } from "vitest";
import { isTruncatedEmptyCompletion } from "../../open-sse/handlers/chatCore/nonStreamingHandler.js";

// 9router #4254: upstream burns the whole budget on reasoning and reports
// truncation with zero usable content — must fail so fallback engages.
describe("isTruncatedEmptyCompletion", () => {
  it("flags Responses incomplete status with empty output", () => {
    expect(isTruncatedEmptyCompletion({
      object: "response",
      status: "incomplete",
      output: [{ type: "reasoning", id: "rs_1" }],
      usage: { output_tokens: 100 },
    })).toBe(true);
  });

  it("flags Chat finish_reason length with empty content and no tools", () => {
    expect(isTruncatedEmptyCompletion({
      choices: [{ message: { role: "assistant", content: "" }, finish_reason: "length" }],
    })).toBe(true);
  });

  it("passes partial text even when truncated", () => {
    expect(isTruncatedEmptyCompletion({
      choices: [{ message: { role: "assistant", content: "half an answer" }, finish_reason: "length" }],
    })).toBe(false);
  });

  it("passes tool-calls-only completions", () => {
    expect(isTruncatedEmptyCompletion({
      choices: [{
        message: { role: "assistant", content: "", tool_calls: [{ id: "1", function: { name: "x", arguments: "{}" } }] },
        finish_reason: "tool_calls",
      }],
    })).toBe(false);
  });

  it("passes completed Responses with text", () => {
    expect(isTruncatedEmptyCompletion({
      object: "response",
      status: "completed",
      output: [{ type: "message", content: [{ type: "output_text", text: "hi" }] }],
    })).toBe(false);
  });

  it("flags Claude max_tokens stop with empty blocks", () => {
    expect(isTruncatedEmptyCompletion({ type: "message", stop_reason: "max_tokens", content: [] })).toBe(true);
  });

  it("returns false for null/garbage", () => {
    expect(isTruncatedEmptyCompletion(null)).toBe(false);
    expect(isTruncatedEmptyCompletion("oops")).toBe(false);
  });
});
