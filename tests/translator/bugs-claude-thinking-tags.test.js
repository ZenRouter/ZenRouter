import { describe, it, expect } from "vitest";
import { claudeToOpenAIResponse } from "open-sse/translator/response/claude-to-openai.js";
import { openaiToOpenAIResponsesResponse } from "open-sse/translator/response/openai-responses.js";

describe("Thinking Tags Leak Prevention (#2622)", () => {
  it("should not emit literal <think> or </think> chunks in content for claude-to-openai", () => {
    const state = {
      messageId: "test_msg",
      model: "claude-3-7-sonnet",
      toolCalls: new Map(),
      toolCallIndex: 0,
      toolNameMap: new Map(),
    };

    const startChunk = {
      type: "content_block_start",
      index: 0,
      content_block: { type: "thinking", thinking: "" },
    };
    const startResult = claudeToOpenAIResponse(startChunk, state);
    expect(startResult).toBeNull();

    const deltaChunk = {
      type: "content_block_delta",
      index: 0,
      delta: { type: "thinking_delta", thinking: "Deep thought" },
    };
    const deltaResult = claudeToOpenAIResponse(deltaChunk, state);
    expect(deltaResult).toHaveLength(1);
    expect(deltaResult[0].choices[0].delta.reasoning_content).toBe("Deep thought");
    expect(deltaResult[0].choices[0].delta.content).toBeUndefined();

    const stopChunk = {
      type: "content_block_stop",
      index: 0,
    };
    const stopResult = claudeToOpenAIResponse(stopChunk, state);
    expect(stopResult).toBeNull();
  });

  it("closes reasoning on normal content transition in openai-responses", () => {
    const state = {
      seq: 0,
      responseId: "resp_123",
      created: Math.floor(Date.now() / 1000),
      started: true,
      msgTextBuf: {},
      msgItemAdded: {},
      msgContentAdded: {},
      msgItemDone: {},
      reasoningId: "rs_123_0",
      reasoningIndex: 0,
      reasoningBuf: "Some thought",
      reasoningPartAdded: true,
      reasoningDone: false,
      inThinking: false,
      funcArgsBuf: {},
      funcNames: {},
      funcCallIds: {},
      funcArgsDone: {},
      funcItemDone: {},
      buffer: "",
      usage: null,
      completedSent: false,
    };

    const chunk = {
      choices: [{
        index: 0,
        delta: { content: "Hello world" }
      }]
    };

    const events = openaiToOpenAIResponsesResponse(chunk, state);
    const eventNames = events.map((e) => e.event);
    expect(eventNames).toContain("response.output_item.done");
    expect(eventNames).toContain("response.output_text.delta");
    expect(state.reasoningDone).toBe(true);
  });
});
