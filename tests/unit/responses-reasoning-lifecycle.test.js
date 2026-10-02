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

function assertTerminalItems(events, types) {
  const added = events.filter((event) => event.type === "response.output_item.added");
  const done = events.filter((event) => event.type === "response.output_item.done");
  const completed = events.filter((event) => event.type === "response.completed");
  expect(added.map((event) => event.item.type)).toEqual(types);
  expect(added.map((event) => event.output_index)).toEqual(types.map((_, index) => index));
  expect(added.every((event) => event.item.status === "in_progress")).toBe(true);
  expect(done.map((event) => event.item.id).sort()).toEqual(added.map((event) => event.item.id).sort());
  for (const event of done) {
    const opened = added.find((entry) => entry.item.id === event.item.id);
    expect(event.output_index).toBe(opened.output_index);
    expect(event.item.status).toBe("completed");
  }
  for (const event of events.filter((event) => event.item_id)) {
    expect(event.output_index).toBe(added.find((entry) => entry.item.id === event.item_id).output_index);
  }
  expect(completed).toHaveLength(1);
  const output = completed[0].response.output;
  expect(output).toEqual(added.map((event) => done.find((entry) => entry.item.id === event.item.id).item));
  expect(output.every((item) => !("output_index" in item) && !("sequence_number" in item))).toBe(true);
  return output;
}

const final = chunk({}, { finish_reason: "stop" });
const usage = { prompt_tokens: 7, completion_tokens: 3, total_tokens: 10 };
const trailer = { choices: [], usage };

describe.each(converters)("%s reasoning lifecycle", (_name, create) => {
  it("retains reasoning, text and fragmented tool arguments in terminal output with unique indexes", async () => {
    const events = await collect([
      chunk({ reasoning_content: "Plan", content: "Answer" }),
      chunk({ tool_calls: [{ index: 0, id: "call_terminal", function: { name: "lookup", arguments: '{"q":' } }] }),
      chunk({ tool_calls: [{ index: 0, function: { arguments: '"weather"}' } }] }),
      chunk({}, { finish_reason: "tool_calls" }), trailer,
    ], create());
    const output = assertTerminalItems(events, ["reasoning", "message", "function_call"]);
    expect(output[0].summary).toEqual([{ type: "summary_text", text: "Plan" }]);
    expect(output[1].content[0].text).toBe("Answer");
    expect(output[2]).toMatchObject({ call_id: "call_terminal", name: "lookup", arguments: '{"q":"weather"}' });
    expect(events.find((event) => event.type === "response.completed").response.usage)
      .toMatchObject({ input_tokens: 7, output_tokens: 3, total_tokens: 10 });
  });

  it("orders interleaved choice messages and tool indexes by item creation rather than upstream indexes", async () => {
    const events = await collect([
      { id: "chatcmpl-lifecycle", choices: [{ index: 4, delta: { content: "Fourth" } }] },
      chunk({ content: "First" }),
      chunk({ tool_calls: [
        { index: 2, id: "call_second", function: { name: "second", arguments: '{"b":2}' } },
        { index: 0, id: "call_first", function: { name: "first", arguments: '{"a":1}' } },
      ] }),
      chunk({}, { finish_reason: "tool_calls" }), trailer,
    ], create());
    const output = assertTerminalItems(events, ["message", "message", "function_call", "function_call"]);
    expect(output.slice(0, 2).map((item) => item.content[0].text)).toEqual(["Fourth", "First"]);
    expect(output.slice(2).map((item) => [item.call_id, item.arguments]))
      .toEqual([["call_second", '{"b":2}'], ["call_first", '{"a":1}']]);
  });

  it("opens a fresh message after a tool transition rather than appending to a completed item", async () => {
    const events = await collect([
      chunk({ reasoning_content: "Before", content: "Opening" }),
      chunk({ tool_calls: [{ index: 0, id: "call_between", function: { name: "lookup", arguments: "{}" } }] }),
      chunk({ reasoning_content: "After", content: "Closing" }), final, trailer,
    ], create());
    const output = assertTerminalItems(events, ["reasoning", "message", "function_call", "reasoning", "message"]);
    expect(output.filter((item) => item.type === "reasoning").map((item) => item.summary[0].text)).toEqual(["Before", "After"]);
    expect(output.filter((item) => item.type === "message").map((item) => item.content[0].text)).toEqual(["Opening", "Closing"]);
    expect(output.find((item) => item.type === "function_call").arguments).toBe("{}");
  });

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

describe.each(converters)("%s custom tool terminal output", (name) => {
  it("preserves completed freeform input alongside reasoning and text", async () => {
    const customToolNames = ["exec"];
    const transform = name === "Responses transformer"
      ? createResponsesApiTransformStream(null, { customToolNames })
      : createSSEStream({ targetFormat: FORMATS.OPENAI, sourceFormat: FORMATS.OPENAI_RESPONSES, customToolNames });
    const events = await collect([
      chunk({ reasoning_content: "Execute", content: "Running" }),
      chunk({ tool_calls: [{ index: 0, id: "call_custom", function: { name: "exec", arguments: '{"input":"print(' } }] }),
      chunk({ tool_calls: [{ index: 0, function: { arguments: '1)"}' } }] }),
      chunk({}, { finish_reason: "tool_calls" }), trailer,
    ], transform);
    const output = assertTerminalItems(events, ["reasoning", "message", "custom_tool_call"]);
    expect(output[2]).toMatchObject({ call_id: "call_custom", name: "exec", input: "print(1)" });
    expect(output[2]).not.toHaveProperty("arguments");
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
