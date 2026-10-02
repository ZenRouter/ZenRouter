import { describe, it, expect } from "vitest";
import { translateNonStreamingResponse } from "../../open-sse/handlers/chatCore/nonStreamingHandler.js";
import { FORMATS } from "../../open-sse/translator/formats.js";
import { addBufferToUsage, filterUsageForFormat } from "../../open-sse/utils/usageTracking.js";

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

describe("Native provider JSON usage for OpenAI clients", () => {
  it("counts Claude cache reads and writes once in the prompt and retains their split after filtering", () => {
    const native = {
      id: "msg-cache",
      model: "claude",
      content: [{ type: "text", text: "hello" }],
      stop_reason: "end_turn",
      usage: { input_tokens: 100, output_tokens: 7, cache_read_input_tokens: 5000, cache_creation_input_tokens: 300 },
    };
    const translated = translateNonStreamingResponse(native, FORMATS.CLAUDE, FORMATS.OPENAI);
    expect(translated.usage).toEqual({
      prompt_tokens: 5400,
      completion_tokens: 7,
      total_tokens: 5407,
      prompt_tokens_details: { cached_tokens: 5000, cache_creation_tokens: 300 },
    });
    const client = filterUsageForFormat(addBufferToUsage(translated.usage), FORMATS.OPENAI);
    expect(client.prompt_tokens).toBe(7400);
    expect(client.completion_tokens).toBe(7);
    expect(client.total_tokens).toBe(7407);
    expect(client.prompt_tokens_details).toEqual({ cached_tokens: 5000, cache_creation_tokens: 300 });
  });

  describe.each([FORMATS.GEMINI, FORMATS.ANTIGRAVITY, FORMATS.GEMINI_CLI, FORMATS.VERTEX])("%s usage", (providerFormat) => {
    const usageFor = (metadata) => translateNonStreamingResponse({
      candidates: [{ content: { parts: [{ text: "hello" }] }, finishReason: "STOP" }],
      usageMetadata: metadata,
    }, providerFormat, FORMATS.OPENAI).usage;

    it("derives a missing total and counts thoughts as output, not input", () => {
      expect(usageFor({ promptTokenCount: 10, candidatesTokenCount: 20, thoughtsTokenCount: 3, cachedContentTokenCount: 4 })).toEqual({
        prompt_tokens: 10,
        completion_tokens: 23,
        total_tokens: 33,
        prompt_tokens_details: { cached_tokens: 4 },
        completion_tokens_details: { reasoning_tokens: 3 },
      });
    });

    it.each([999, 0])("preserves a supplied total of %s", (totalTokenCount) => {
      expect(usageFor({ promptTokenCount: 10, candidatesTokenCount: 20, thoughtsTokenCount: 3, totalTokenCount })).toEqual({
        prompt_tokens: 10,
        completion_tokens: 23,
        total_tokens: totalTokenCount,
        completion_tokens_details: { reasoning_tokens: 3 },
      });
    });

    it("derives thought-only completion and total when candidates and total are absent", () => {
      expect(usageFor({ promptTokenCount: 7, thoughtsTokenCount: 3 })).toEqual({
        prompt_tokens: 7,
        completion_tokens: 3,
        total_tokens: 10,
        completion_tokens_details: { reasoning_tokens: 3 },
      });
    });
  });
});
