import { describe, expect, it, vi } from "vitest";
import { createSSEStream } from "../../open-sse/utils/stream.js";
import { createResponsesApiTransformStream } from "../../open-sse/transformer/responsesTransformer.js";
import { FORMATS } from "../../open-sse/translator/formats.js";

vi.mock("@/lib/usageDb.js", () => ({
  trackPendingRequest: vi.fn(),
  appendRequestLog: vi.fn(async () => {}),
}));

const encoder = new TextEncoder();
const frame = (value) => `data: ${JSON.stringify(value)}\n\n`;
const chunk = (delta, extra = {}) => ({
  id: "chatcmpl-lifecycle", choices: [{ index: 0, delta, ...extra }],
});
const converters = [
  ["Responses transformer", () => createResponsesApiTransformStream()],
  ["direct SSE converter", () => createSSEStream({
    targetFormat: FORMATS.OPENAI, sourceFormat: FORMATS.OPENAI_RESPONSES,
  })],
];

async function collect(chunks, transform) {
  const source = new ReadableStream({
    start(controller) {
      for (const value of chunks) controller.enqueue(encoder.encode(frame(value)));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  const text = await new Response(source.pipeThrough(transform)).text();
  return text.split("\n").filter((line) => line.startsWith("data:") && !line.includes("[DONE]"))
    .map((line) => JSON.parse(line.slice(5).trim()));
}

function assertReasoningClosedBefore(events, itemType, text) {
  const added = events.find((event) => event.type === "response.output_item.added" && event.item.type === "reasoning");
  const closure = events.filter((event) =>
    ((event.type === "response.reasoning_summary_text.done" || event.type === "response.reasoning_summary_part.done") &&
      event.item_id === added.item.id) ||
    (event.type === "response.output_item.done" && event.item.id === added.item.id));
  expect(closure.map((event) => event.type)).toEqual([
    "response.reasoning_summary_text.done", "response.reasoning_summary_part.done", "response.output_item.done",
  ]);
  expect(closure[0].text).toBe(text);
  expect(closure[1].part.text).toBe(text);
  expect(closure[2].item.summary).toEqual([{ type: "summary_text", text }]);
  const next = events.findIndex((event) => event.type === "response.output_item.added" && event.item.type === itemType);
  expect(next).toBeGreaterThan(events.indexOf(closure[2]));
}

const final = chunk({}, { finish_reason: "stop" });
const usage = { prompt_tokens: 7, completion_tokens: 3, total_tokens: 10 };
const trailer = { choices: [], usage };

describe.each(converters)("%s reasoning lifecycle", (_name, create) => {
  it("closes native reasoning before opening a text item, preserving text and late usage", async () => {
    const events = await collect([
      chunk({ reasoning_content: "First " }), chunk({ reasoning_content: "think" }),
      chunk({ content: "The " }), chunk({ content: "answer" }), final, trailer,
    ], create());
    assertReasoningClosedBefore(events, "message", "First think");
    expect(events.filter((event) => event.type === "response.output_text.delta").map((event) => event.delta).join("")).toBe("The answer");
    expect(events.find((event) => event.type === "response.output_text.done").text).toBe("The answer");
    expect(events.filter((event) => event.type === "response.completed")).toHaveLength(1);
    expect(events.find((event) => event.type === "response.completed").response.usage)
      .toMatchObject({ input_tokens: 7, output_tokens: 3, total_tokens: 10 });
  });

  it("closes native reasoning before opening a tool item without losing call ids or fragmented arguments", async () => {
    const events = await collect([
      chunk({ reasoning_content: "Need a tool" }),
      chunk({ tool_calls: [{ index: 0, id: "call_lifecycle", function: { name: "lookup", arguments: '{"q":' } }] }),
      chunk({ tool_calls: [{ index: 0, function: { arguments: '"weather"}' } }] }),
      chunk({}, { finish_reason: "tool_calls" }), trailer,
    ], create());
    assertReasoningClosedBefore(events, "function_call", "Need a tool");
    const added = events.find((event) => event.type === "response.output_item.added" && event.item.type === "function_call");
    const done = events.find((event) => event.type === "response.output_item.done" && event.item.type === "function_call");
    expect(done.item).toMatchObject({ id: added.item.id, call_id: "call_lifecycle", name: "lookup", arguments: '{"q":"weather"}' });
    const deltas = events.filter((event) => event.type === "response.function_call_arguments.delta");
    expect(deltas.map((event) => event.delta).join("")).toBe(done.item.arguments);
    expect(deltas.every((event) => event.item_id === added.item.id)).toBe(true);
  });

  it("closes reasoning before text in the same upstream delta", async () => {
    const events = await collect([chunk({ reasoning_content: "Thought", content: "Answer" }), final, trailer], create());
    assertReasoningClosedBefore(events, "message", "Thought");
    expect(events.find((event) => event.type === "response.output_text.done").text).toBe("Answer");
  });

  it("propagates an aborted upstream rather than reporting completed", async () => {
    let upstream;
    const source = new ReadableStream({ start(controller) { upstream = controller; } });
    const reader = source.pipeThrough(create()).getReader();
    upstream.enqueue(encoder.encode(frame(chunk({ reasoning_content: "partial thought" }))));
    const observed = [];
    for (let index = 0; index < 5; index++) observed.push(new TextDecoder().decode((await reader.read()).value));
    const pending = reader.read();
    upstream.error(new Error("upstream aborted"));
    await expect(pending).rejects.toThrow("upstream aborted");
    expect(observed.join("")).not.toContain("response.completed");
  });
});

it("closes an unterminated think-tag item before a tool, allowing later text", async () => {
  const events = await collect([
    chunk({ content: "<think>Need a tool" }),
    chunk({ tool_calls: [{ index: 0, id: "call_tag", function: { name: "lookup", arguments: "{}" } }] }),
    chunk({ content: "Answer" }), final, trailer,
  ], createResponsesApiTransformStream());
  assertReasoningClosedBefore(events, "function_call", "Need a tool");
  expect(events.find((event) => event.type === "response.output_text.done").text).toBe("Answer");
});

it("direct SSE converter exits unterminated think tags at the tool transition", async () => {
  const events = await collect([
    chunk({ content: "<think>Need a tool" }),
    chunk({ tool_calls: [{ index: 0, id: "call_tag", function: { name: "lookup", arguments: "{}" } }] }),
    chunk({ content: "Answer" }), final, trailer,
  ], createSSEStream({ targetFormat: FORMATS.OPENAI, sourceFormat: FORMATS.OPENAI_RESPONSES }));
  assertReasoningClosedBefore(events, "function_call", "Need a tool");
  const reasoningDone = events.findIndex((event) => event.type === "response.output_item.done" && event.item.type === "reasoning");
  expect(events.slice(reasoningDone + 1).filter((event) => event.type === "response.reasoning_summary_text.delta")).toEqual([]);
  expect(events.filter((event) => event.type === "response.output_text.delta").map((event) => event.delta).join("")).toBe("Answer");
  expect(events.find((event) => event.type === "response.output_text.done").text).toBe("Answer");
});
