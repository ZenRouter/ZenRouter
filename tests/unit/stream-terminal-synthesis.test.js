import { describe, expect, it } from "vitest";
import { createSSEStream } from "../../open-sse/utils/stream.js";
import { FORMATS } from "../../open-sse/translator/formats.js";

describe("Stream terminal synthesis and tool call logging (#4079, #4080)", () => {
  it("synthesizes finish_reason: network_error when upstream closes without terminal", async () => {
    // Upstream stream that terminates abruptly after one content delta
    const chunk = {
      id: "chatcmpl-cut",
      choices: [{ index: 0, delta: { content: "partial text" } }],
    };

    const sseText = `data: ${JSON.stringify(chunk)}\n\n`;
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(sseText));
        controller.close(); // Clean EOF without finish_reason or [DONE]
      },
    });

    const sseTransform = createSSEStream({
      mode: "passthrough",
      targetFormat: FORMATS.OPENAI,
      sourceFormat: FORMATS.OPENAI,
      model: "gpt-4o",
    });

    const reader = stream.pipeThrough(sseTransform).getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value);
    }

    expect(fullText).toContain('"finish_reason":"network_error"');
    expect(fullText).toContain("data: [DONE]");
  });

  it("accumulates tool calls in stream completion callback", async () => {
    let completedPayload = null;
    const toolCallChunk1 = {
      id: "chatcmpl-tc",
      choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: "call_1", function: { name: "readFile" } }] } }],
    };
    const toolCallChunk2 = {
      id: "chatcmpl-tc",
      choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { arguments: '{"path":' } }] } }],
    };
    const toolCallChunk3 = {
      id: "chatcmpl-tc",
      choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { arguments: '"a.txt"}' } }] }, finish_reason: "tool_calls" }],
    };

    const sseText = [toolCallChunk1, toolCallChunk2, toolCallChunk3]
      .map((c) => `data: ${JSON.stringify(c)}\n\n`)
      .join("") + "data: [DONE]\n\n";

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(sseText));
        controller.close();
      },
    });

    const sseTransform = createSSEStream({
      mode: "passthrough",
      targetFormat: FORMATS.OPENAI,
      sourceFormat: FORMATS.OPENAI,
      onStreamComplete: (payload) => {
        completedPayload = payload;
      },
    });

    const reader = stream.pipeThrough(sseTransform).getReader();
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }

    expect(completedPayload).toBeTruthy();
    expect(completedPayload.toolCalls).toHaveLength(1);
    expect(completedPayload.toolCalls[0].name).toBe("readFile");
    expect(completedPayload.toolCalls[0].arguments).toBe('{"path":"a.txt"}');
  });
});
