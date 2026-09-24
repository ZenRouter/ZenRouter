import { describe, expect, it } from "vitest";
import { createResponsesApiTransformStream } from "../../open-sse/transformer/responsesTransformer.js";

// 9router #4276: a tool the client declared as `type: "custom"` must come back
// as `custom_tool_call` items — a `function_call` payload makes strict clients
// (codex) abort the turn and loop.
async function runThrough(chunks, options) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  }).pipeThrough(createResponsesApiTransformStream(null, options));
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let output = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    output += decoder.decode(value, { stream: true });
  }
  return output;
}

const toolChunks = [
  'data: {"id":"c1","choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"id":"call_1","type":"function","function":{"name":"exec","arguments":""}}]},"finish_reason":null}]}',
  'data: {"id":"c1","choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\\"input\\": \\"ls\\"}"}}]},"finish_reason":null}]}',
  'data: {"id":"c1","choices":[{"index":0,"delta":{},"finish_reason":"tool_calls"}]}',
  "data: [DONE]",
  "",
].join("\n\n");

describe("custom tools round-trip as custom_tool_call", () => {
  it("emits custom_tool_call events for declared custom tools", async () => {
    const output = await runThrough([toolChunks], { customToolNames: ["exec"] });
    expect(output).toContain("response.custom_tool_call_input.delta");
    expect(output).toContain("response.custom_tool_call_input.done");
    const doneEvent = output.split("\n\n").find((e) => e.startsWith("event: response.output_item.done"));
    const item = JSON.parse(doneEvent.match(/^data: (.+)$/m)[1]).item;
    expect(item.type).toBe("custom_tool_call");
    expect(item.name).toBe("exec");
    expect(item.call_id).toBe("call_1");
    expect(item.input).toBe("ls");
    expect(output).not.toContain("function_call");
  });

  it("still emits function_call for ordinary tools", async () => {
    const output = await runThrough([toolChunks], { customToolNames: [] });
    expect(output).toContain('"type":"function_call"');
    expect(output).not.toContain("custom_tool_call");
  });
});
