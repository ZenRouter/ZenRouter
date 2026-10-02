import { describe, expect, it, vi } from "vitest";
import { createSSEStream } from "../../open-sse/utils/stream.js";
import { FORMATS } from "../../open-sse/translator/formats.js";

vi.mock("@/lib/usageDb.js", () => ({
  trackPendingRequest: vi.fn(),
  appendRequestLog: vi.fn(async () => {}),
}));

const encoder = new TextEncoder();
const usage = {
  prompt_tokens: 7, completion_tokens: 3, total_tokens: 10,
  prompt_tokens_details: { cached_tokens: 2 },
};
const frame = (value) => `data: ${JSON.stringify(value)}\n\n`;
const chunk = (delta, extra = {}) => ({
  id: "chatcmpl-boundary", object: "chat.completion.chunk", created: 1,
  choices: [{ index: 0, delta, ...extra }],
});
const prefix = frame(chunk({ content: "Hello 🌍" })) +
  frame(chunk({}, { finish_reason: "stop" })) + frame({ choices: [], usage });

function source(bytes, splitBytes) {
  return new ReadableStream({
    start(controller) {
      if (splitBytes) {
        for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
      } else {
        controller.enqueue(bytes);
      }
      controller.close();
    },
  });
}

async function drain(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const chunks = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return chunks.join("") + decoder.decode();
    chunks.push(decoder.decode(value, { stream: true }));
  }
}

function makeTransform(mode, onStreamComplete) {
  return createSSEStream({
    mode, targetFormat: FORMATS.OPENAI, sourceFormat: FORMATS.OPENAI,
    model: "boundary-model", onStreamComplete,
  });
}

describe.each(["translate", "passthrough"])("%s OpenAI terminal sentinel boundaries", (mode) => {
  it.each([
    ["final newline", "data: [DONE]\n\n", false],
    ["no final newline", "data: [DONE]", false],
    ["split bytes", "data: [DONE]\n\n", true],
    ["split bytes without final newline", "data: [DONE]", true],
    ["duplicate sentinel at tail", "data: [DONE]\n\ndata: [DONE]", true],
    ["upstream omits sentinel", "", true],
  ])("emits exactly one DONE with %s without losing text or usage", async (_name, tail, splitBytes) => {
    const completed = vi.fn();
    const output = await drain(source(encoder.encode(prefix + tail), splitBytes)
      .pipeThrough(makeTransform(mode, completed)));
    const data = output.split("\n").filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim());
    expect(data.filter((value) => value === "[DONE]")).toEqual(["[DONE]"]);
    expect(data.at(-1)).toBe("[DONE]");
    const json = data.filter((value) => value !== "[DONE]").map(JSON.parse);
    expect(json.flatMap((value) => value.choices || [])
      .map((choice) => choice.delta?.content || "").join("")).toBe("Hello 🌍");
    expect(json.flatMap((value) => value.choices || [])
      .filter((choice) => choice.finish_reason).map((choice) => choice.finish_reason)).toEqual(["stop"]);
    expect(json.find((value) => value.choices?.length === 0)?.usage).toEqual(usage);
    expect(completed).toHaveBeenCalledTimes(1);
    expect(completed.mock.calls[0][0].content).toBe("Hello 🌍");
    expect(completed.mock.calls[0][1]).toMatchObject({
      completion_tokens: 3, prompt_tokens_details: { cached_tokens: 2 },
    });
  });

  it("does not infer a successful completion or swallow an upstream error", async () => {
    const completed = vi.fn();
    let upstream;
    const input = new ReadableStream({ start(controller) { upstream = controller; } });
    const transform = makeTransform(mode, completed);
    const reader = input.pipeThrough(transform).getReader();
    upstream.enqueue(encoder.encode(frame(chunk({ content: "partial" }))));
    const { value } = await reader.read();
    let observed = new TextDecoder().decode(value);
    while (!observed.endsWith("\n\n")) {
      observed += new TextDecoder().decode((await reader.read()).value);
    }
    expect(observed).toContain("partial");
    upstream.error(new Error("socket failure"));
    await expect(reader.read()).rejects.toThrow("socket failure");
    expect(completed).not.toHaveBeenCalled();
    expect(new TextDecoder().decode(transform.abortTerminalBytes())).toContain('"finish_reason":"network_error"');
  });
});

it.each([
  ["final newline", "data: [DONE]\n\n", false],
  ["no final newline", "data: [DONE]", false],
  ["split bytes", "data: [DONE]\n\n", true],
])("Gemini-to-OpenAI emits exactly one DONE with %s", async (_name, tail, splitBytes) => {
  const upstream = {
    responseId: "gemini-boundary", modelVersion: "boundary-model",
    candidates: [{ index: 0, content: { parts: [{ text: "Hello 🌍" }] }, finishReason: "STOP" }],
    usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 3, totalTokenCount: 10 },
  };
  const completed = vi.fn();
  const transform = createSSEStream({
    targetFormat: FORMATS.GEMINI, sourceFormat: FORMATS.OPENAI, onStreamComplete: completed,
  });
  const output = await drain(source(encoder.encode(frame(upstream) + tail), splitBytes).pipeThrough(transform));
  const data = output.split("\n").filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim());
  expect(data.filter((value) => value === "[DONE]")).toEqual(["[DONE]"]);
  expect(data.at(-1)).toBe("[DONE]");
  const choices = data.filter((value) => value !== "[DONE]").map(JSON.parse).flatMap((value) => value.choices);
  expect(choices.map((choice) => choice.delta?.content || "").join("")).toBe("Hello 🌍");
  expect(choices.filter((choice) => choice.finish_reason).map((choice) => choice.finish_reason)).toEqual(["stop"]);
  expect(completed.mock.calls[0][1]).toMatchObject({ completion_tokens: 3 });
});
