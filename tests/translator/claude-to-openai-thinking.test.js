import { describe, it, expect } from "vitest";
import "./registerAll.js";
import { translateRequest } from "../../open-sse/translator/index.js";
import { FORMATS } from "../../open-sse/translator/formats.js";
import { claudeToOpenAIRequest } from "../../open-sse/translator/request/claude-to-openai.js";

describe("claude-to-openai thinking blocks translation", () => {
  it("translates Claude assistant thinking blocks to OpenAI reasoning_content without emitting placeholder text", () => {
    const body = {
      model: "gpt-4o",
      messages: [
        {
          role: "assistant",
          content: [
            { type: "thinking", thinking: "Step 1: Check architecture. Step 2: Formulate answer." },
            { type: "text", text: "Architecture validated successfully." }
          ]
        },
        {
          role: "user",
          content: "What is next?"
        }
      ]
    };

    const result = translateRequest(FORMATS.CLAUDE, FORMATS.OPENAI, "gpt-4o", body);
    expect(result.messages).toBeDefined();

    const assistantMsg = result.messages.find(m => m.role === "assistant");
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg.reasoning_content).toBe("Step 1: Check architecture. Step 2: Formulate answer.");
    expect(assistantMsg.content).toBe("Architecture validated successfully.");
    expect(assistantMsg.content).not.toContain("block omitted");
  });

  it("preserves assistant message when content is only a thinking block", () => {
    const body = {
      model: "gpt-4o",
      messages: [
        {
          role: "assistant",
          content: [
            { type: "thinking", thinking: "Pondering the solution." }
          ]
        }
      ]
    };

    const result = translateRequest(FORMATS.CLAUDE, FORMATS.OPENAI, "gpt-4o", body);
    const assistantMsg = result.messages.find(m => m.role === "assistant");
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg.reasoning_content).toBe("Pondering the solution.");
    expect(assistantMsg.content).not.toContain("block omitted");
  });

  it("does not inject placeholder notice for redacted_thinking block", () => {
    const body = {
      model: "gpt-4o",
      messages: [
        {
          role: "assistant",
          content: [
            { type: "redacted_thinking", data: "encrypted_payload_bytes" },
            { type: "text", text: "Answer without visible thinking." }
          ]
        }
      ]
    };

    const result = translateRequest(FORMATS.CLAUDE, FORMATS.OPENAI, "gpt-4o", body);
    const assistantMsg = result.messages.find(m => m.role === "assistant");
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg.content).toBe("Answer without visible thinking.");
    expect(assistantMsg.content).not.toContain("redacted_thinking block omitted");
  });

  it("still produces placeholder notice for genuinely unsupported block types", () => {
    const body = {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "custom_unknown_artifact", data: "xyz" }
          ]
        }
      ]
    };

    const result = translateRequest(FORMATS.CLAUDE, FORMATS.OPENAI, "gpt-4o", body);
    const userMsg = result.messages.find(m => m.role === "user");
    expect(userMsg).toBeDefined();
    expect(userMsg.content).toContain("[custom_unknown_artifact block omitted: not supported on this route]");
  });
});
