import { describe, it, expect } from "vitest";
import { translateNonStreamingResponse } from "../../open-sse/handlers/chatCore/nonStreamingHandler.js";
import { FORMATS } from "../../open-sse/translator/formats.js";

describe("Claude `/v1/messages` Non-Streaming Response Contract (#3462)", () => {
  it("translates OpenAI chat.completion into Anthropic type: 'message' when sourceFormat is claude", () => {
    const openAIResponse = {
      id: "chatcmpl-test-123",
      object: "chat.completion",
      created: 1700000000,
      model: "gpt-4o",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Hello from OpenAI upstream!",
            reasoning_content: "Thought process here..."
          },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: 15,
        completion_tokens: 25,
        total_tokens: 40
      }
    };

    const translated = translateNonStreamingResponse(openAIResponse, FORMATS.OPENAI, FORMATS.CLAUDE);

    expect(translated.type).toBe("message");
    expect(translated.role).toBe("assistant");
    expect(translated.model).toBe("gpt-4o");
    expect(translated.stop_reason).toBe("end_turn");
    expect(translated.content).toEqual([
      { type: "thinking", thinking: "Thought process here..." },
      { type: "text", text: "Hello from OpenAI upstream!" }
    ]);
    expect(translated.usage).toEqual({
      input_tokens: 15,
      output_tokens: 25
    });
    expect(translated.choices).toBeUndefined();
    expect(translated.object).toBeUndefined();
  });

  it("translates tool calls from OpenAI completion into tool_use blocks", () => {
    const openAIToolResponse = {
      id: "chatcmpl-tool-456",
      object: "chat.completion",
      model: "gpt-4o",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "call_abc123",
                type: "function",
                function: {
                  name: "get_weather",
                  arguments: JSON.stringify({ location: "Tokyo" })
                }
              }
            ]
          },
          finish_reason: "tool_calls"
        }
      ],
      usage: { prompt_tokens: 10, completion_tokens: 20 }
    };

    const translated = translateNonStreamingResponse(openAIToolResponse, FORMATS.OPENAI, FORMATS.CLAUDE);

    expect(translated.type).toBe("message");
    expect(translated.stop_reason).toBe("tool_use");
    expect(translated.content).toEqual([
      {
        type: "tool_use",
        id: "call_abc123",
        name: "get_weather",
        input: { location: "Tokyo" }
      }
    ]);
  });
});
