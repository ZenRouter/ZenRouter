import { describe, expect, it } from "vitest";
import "../translator/registerAll.js";
import { translateRequest } from "../../open-sse/translator/index.js";
import { FORMATS } from "../../open-sse/translator/formats.js";

describe("Tool choice policy and strict preservation (#4171, #4172)", () => {
  it("translates OpenAI tool_choice: 'none' to Claude { type: 'none' }", () => {
    const body = {
      model: "claude-3-5-sonnet",
      messages: [{ role: "user", content: "hello" }],
      tool_choice: "none",
      tools: [{ type: "function", function: { name: "test_tool", parameters: { type: "object" } } }],
    };
    const translated = translateRequest(FORMATS.OPENAI, FORMATS.CLAUDE, "claude-3-5-sonnet", body);
    expect(translated.tool_choice).toEqual({ type: "none" });
  });

  it("translates Claude tool_choice: { type: 'none' } to OpenAI 'none'", () => {
    const body = {
      model: "gpt-4o",
      messages: [{ role: "user", content: "hello" }],
      tool_choice: { type: "none" },
      tools: [{ name: "test_tool", input_schema: { type: "object" } }],
    };
    const translated = translateRequest(FORMATS.CLAUDE, FORMATS.OPENAI, "gpt-4o", body);
    expect(translated.tool_choice).toBe("none");
  });

  it("translates parallel_tool_calls: false to Claude disable_parallel_tool_use: true", () => {
    const body = {
      model: "claude-3-5-sonnet",
      messages: [{ role: "user", content: "hello" }],
      tool_choice: "required",
      parallel_tool_calls: false,
      tools: [{ type: "function", function: { name: "test_tool", parameters: { type: "object" } } }],
    };
    const translated = translateRequest(FORMATS.OPENAI, FORMATS.CLAUDE, "claude-3-5-sonnet", body);
    expect(translated.tool_choice).toEqual({
      type: "any",
      disable_parallel_tool_use: true,
    });
  });

  it("preserves function strict: true when translating OpenAI to Claude", () => {
    const body = {
      model: "claude-3-5-sonnet",
      messages: [{ role: "user", content: "hello" }],
      tools: [
        {
          type: "function",
          function: {
            name: "strict_tool",
            strict: true,
            parameters: { type: "object" },
          },
        },
      ],
    };
    const translated = translateRequest(FORMATS.OPENAI, FORMATS.CLAUDE, "claude-3-5-sonnet", body);
    expect(translated.tools[0].strict).toBe(true);
  });

  it("preserves role developer when target provider is openai (#4172)", () => {
    const body = {
      model: "gpt-4o",
      messages: [{ role: "developer", content: "system instructions" }],
    };
    const translated = translateRequest(
      FORMATS.OPENAI,
      FORMATS.OPENAI,
      "gpt-4o",
      body,
      true,
      null,
      "openai"
    );
    expect(translated.messages[0].role).toBe("developer");
  });

  it("rewrites role developer to system when target provider does not support it (#4172)", () => {
    const body = {
      model: "glm-4",
      messages: [{ role: "developer", content: "system instructions" }],
    };
    const translated = translateRequest(
      FORMATS.OPENAI,
      FORMATS.OPENAI,
      "glm-4",
      body,
      true,
      null,
      "glm"
    );
    expect(translated.messages[0].role).toBe("system");
  });
});
