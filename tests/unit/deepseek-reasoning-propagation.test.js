import { describe, expect, it } from "vitest";
import { createSSEStream } from "../../open-sse/utils/stream.js";
import { FORMATS } from "../../open-sse/translator/formats.js";

describe("DeepSeek and OpenRouter reasoning propagation (#4082)", () => {
  it("populates delta.reasoning from upstream delta.reasoning_content without stripping", async () => {
    const chunk = {
      id: "chatcmpl-1",
      choices: [
        {
          index: 0,
          delta: {
            reasoning_content: "thinking step 1",
          },
        },
      ],
    };

    const sseText = `data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\n`;
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
    });

    const transformed = stream.pipeThrough(sseTransform);
    const reader = transformed.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value);
    }

    expect(text).toContain('"reasoning_content":"thinking step 1"');
    expect(text).toContain('"reasoning":"thinking step 1"');
  });

  it("populates delta.reasoning_content from upstream delta.reasoning without stripping delta.reasoning", async () => {
    const chunk = {
      id: "chatcmpl-2",
      choices: [
        {
          index: 0,
          delta: {
            reasoning: "thinking step 2",
          },
        },
      ],
    };

    const sseText = `data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\n`;
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
    });

    const transformed = stream.pipeThrough(sseTransform);
    const reader = transformed.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value);
    }

    expect(text).toContain('"reasoning":"thinking step 2"');
    expect(text).toContain('"reasoning_content":"thinking step 2"');
  });
});
