import { describe, expect, it } from "vitest";
import { createResponsesApiTransformStream } from "../../open-sse/transformer/responsesTransformer.js";

const input = [
  'data: {"id":"chatcmpl-usage","choices":[{"index":0,"delta":{"content":"hello"},"finish_reason":null}]}',
  'data: {"id":"chatcmpl-usage","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}',
  'data: {"id":"chatcmpl-usage","choices":[],"usage":{"prompt_tokens":884,"completion_tokens":37,"total_tokens":921,"prompt_tokens_details":{"cached_tokens":256},"completion_tokens_details":{"reasoning_tokens":12}}}',
  "data: [DONE]",
  "",
].join("\n\n");

it("includes upstream usage in response.completed", async () => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(input));
      controller.close();
    },
  }).pipeThrough(createResponsesApiTransformStream());
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let output = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    output += decoder.decode(value, { stream: true });
  }
  const completed = output.split("\n\n").find((event) => event.startsWith("event: response.completed"));
  const payload = JSON.parse(completed.match(/^data: (.+)$/m)[1]);
  expect(payload.response.usage).toEqual({
    input_tokens: 884,
    output_tokens: 37,
    total_tokens: 921,
    input_tokens_details: { cached_tokens: 256 },
    output_tokens_details: { reasoning_tokens: 12 },
  });
});