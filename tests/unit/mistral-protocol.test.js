import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/usageDb.js", () => ({
  trackPendingRequest: vi.fn(),
  appendRequestLog: vi.fn(async () => {}),
  saveRequestDetail: vi.fn(async () => {}),
  saveRequestUsage: vi.fn(async () => {}),
}));
vi.mock("../../open-sse/utils/proxyFetch.js", () => ({ proxyAwareFetch: vi.fn() }));

const { FORMATS } = await import("../../open-sse/translator/formats.js");
const { translateRequest } = await import("../../open-sse/translator/index.js");
const { stripUnsupportedParams } = await import("../../open-sse/translator/concerns/paramSupport.js");
const { normalizeTypedContent } = await import("../../open-sse/translator/concerns/typedContent.js");
const { createSSEStream } = await import("../../open-sse/utils/stream.js");
const { parseSSEToOpenAIResponse } = await import("../../open-sse/handlers/chatCore/sseToJsonHandler.js");
const { translateNonStreamingResponse } = await import("../../open-sse/handlers/chatCore/nonStreamingHandler.js");
const { DefaultExecutor } = await import("../../open-sse/executors/default.js");
const { proxyAwareFetch } = await import("../../open-sse/utils/proxyFetch.js");

const typed = () => [
  { type: "thinking", thinking: [{ type: "text", text: "Work " }, { type: "text", text: "it out" }], closed: true },
  { type: "text", text: "42" },
];
const completion = () => ({
  id: "chatcmpl-mistral", object: "chat.completion", model: "mistral-medium-3-5", created: 123,
  choices: [{ index: 0, message: { role: "assistant", content: typed() }, finish_reason: "stop" }],
  usage: { prompt_tokens: 3, completion_tokens: 9, total_tokens: 12 },
});
const data = (delta, finish_reason = null) => `data: ${JSON.stringify({
  id: "chatcmpl-mistral", object: "chat.completion.chunk", model: "mistral-medium-3-5", created: 123,
  choices: [{ index: 0, delta, finish_reason }],
})}\n\n`;
const wire = () => data({ role: "assistant" })
  + data({ content: [{ type: "thinking", thinking: "Work " }] })
  + data({ content: [{ type: "thinking", thinking: [{ type: "text", text: "it out" }], closed: true }, { type: "text", text: "4" }] })
  + data({ content: "2" }) + data({}, "stop") + "data: [DONE]\n\n";

async function consume(options, text = wire()) {
  const transform = createSSEStream(options);
  const bytes = new TextEncoder().encode(text);
  // Exercise incremental framing, including multibyte-safe byte decoding.
  const upstream = new ReadableStream({ start(controller) {
    for (let offset = 0; offset < bytes.length; offset += 17) controller.enqueue(bytes.subarray(offset, offset + 17));
    controller.close();
  } });
  return new Response(upstream.pipeThrough(transform)).text();
}
const events = (text) => text.split("\n").filter((line) => line.startsWith("data:") && !line.includes("[DONE]"))
  .map((line) => JSON.parse(line.slice(5)));

function outbound(provider, model) {
  const request = translateRequest(FORMATS.OPENAI, FORMATS.OPENAI, model, {
    reasoning_effort: "high", thinking: { type: "enabled" },
    messages: [{ role: "assistant", content: "previous", reasoning_content: "old", reasoning: "old" }, { role: "user", content: "continue" }],
  }, true, null, provider);
  return stripUnsupportedParams(provider, model, request);
}

describe("Mistral strict request dialect", () => {
  it("sends strict serialized Mistral fields while retaining tool and answer history", async () => {
    proxyAwareFetch.mockReset();
    proxyAwareFetch.mockResolvedValue(Response.json(completion()));
    const model = "zai-glm-5-2";
    const body = translateRequest(FORMATS.OPENAI, FORMATS.OPENAI, model, {
      reasoning_effort: "high", thinking: { type: "enabled" },
      messages: [
        { role: "assistant", content: "previous", reasoning_content: "private", reasoning: "private", tool_calls: [{ id: "call-1", type: "function", function: { name: "lookup", arguments: "{}" } }] },
        { role: "tool", tool_call_id: "call-1", content: "result" },
        { role: "user", content: "continue" },
      ],
    }, true, null, "mistral");
    await new DefaultExecutor("mistral").execute({ model, body, stream: true, credentials: { apiKey: "synthetic-key" } });
    const [url, init] = proxyAwareFetch.mock.calls.at(-1);
    const sent = JSON.parse(init.body);
    expect(url).toBe("https://api.mistral.ai/v1/chat/completions");
    expect(sent.reasoning_effort).toBe("high");
    expect(sent.thinking).toBeUndefined();
    expect(sent.messages[0].reasoning_content).toBeUndefined();
    expect(sent.messages[0].reasoning).toBeUndefined();
    expect(sent.messages[0].content).toBe("previous");
    expect(sent.messages[0].tool_calls[0].id).toBe("call-1");
    expect(sent.messages[1]).toEqual({ role: "tool", tool_call_id: "call-1", content: "result" });
  });
  it.each(["zai-glm-5-2", "deepseek-v4-pro", "qwen3-max", "MiniMax-M3"])("uses Chat effort for hosted %s without native fields or replay", (model) => {
    const request = outbound("mistral", model);
    expect(request.reasoning_effort).toBe("high");
    expect(request.thinking).toBeUndefined();
    expect(request.enable_thinking).toBeUndefined();
    expect(request.thinking_budget).toBeUndefined();
    expect(request.messages[0]).toEqual({ role: "assistant", content: "previous" });
  });
  it.each([
    ["glm-cn", "glm-5.3", "thinking", { type: "enabled" }],
    ["deepseek", "deepseek-v4-pro", "thinking", { type: "enabled" }],
    ["qwen", "qwen3-max", "enable_thinking", true],
  ])("retains %s native request dialect", (provider, model, key, value) => {
    const request = outbound(provider, model);
    expect(request[key]).toEqual(value);
    expect(request.messages[0].reasoning_content).toBe("old");
  });
  it.each(["deepseek", "kimi"])("preserves independent %s reasoning continuity", (provider) => {
    const request = outbound(provider, provider === "deepseek" ? "deepseek-v4-pro" : "kimi-k2.7");
    expect(request.messages[0].reasoning_content).toBe("old");
  });
});

describe("Mistral typed responses", () => {
  it.each([FORMATS.OPENAI, FORMATS.CLAUDE, FORMATS.OPENAI_RESPONSES])("normalizes JSON separately for %s", (client) => {
    const result = translateNonStreamingResponse(completion(), FORMATS.OPENAI, client);
    if (client === FORMATS.OPENAI) {
      expect(result.choices[0].message).toEqual({ role: "assistant", content: "42", reasoning_content: "Work it out" });
    } else if (client === FORMATS.CLAUDE) {
      expect(result.content).toEqual([{ type: "thinking", thinking: "Work it out" }, { type: "text", text: "42" }]);
    } else {
      expect(result.output[0].summary).toEqual([{ type: "summary_text", text: "Work it out" }]);
      expect(result.output[1].content[0].text).toBe("42");
    }
  });
  it("aggregates closing thinking + first text chunks without losing plain-string answer tail", () => {
    expect(parseSSEToOpenAIResponse(wire(), "fallback").choices[0].message).toEqual({ role: "assistant", content: "42", reasoning_content: "Work it out" });
  });
  it("normalizes passthrough byte SSE", async () => {
    const chunks = events(await consume({ mode: "passthrough", provider: "mistral", model: "mistral-medium-3-5" }));
    expect(chunks.map((chunk) => chunk.choices[0].delta.content || "").join("")).toBe("42");
    expect(chunks.map((chunk) => chunk.choices[0].delta.reasoning_content || "").join("")).toBe("Work it out");
  });
  it("translates byte SSE into one thinking block followed by answer", async () => {
    const chunks = events(await consume({ mode: "translate", provider: "mistral", targetFormat: FORMATS.OPENAI, sourceFormat: FORMATS.CLAUDE }));
    expect(chunks.filter((chunk) => chunk.type === "content_block_start").map((chunk) => chunk.content_block.type)).toEqual(["thinking", "text"]);
    expect(chunks.filter((chunk) => chunk.delta?.type === "thinking_delta").map((chunk) => chunk.delta.thinking).join("")).toBe("Work it out");
    expect(chunks.filter((chunk) => chunk.delta?.type === "text_delta").map((chunk) => chunk.delta.text).join("")).toBe("42");
    expect(chunks.filter((chunk) => chunk.type === "content_block_stop").map((chunk) => chunk.index)).toEqual([0, 1]);
    expect(chunks.at(-1).type).toBe("message_stop");
  });
  it("translates byte SSE into distinct Responses reasoning and answer items", async () => {
    const chunks = events(await consume({ mode: "translate", provider: "mistral", targetFormat: FORMATS.OPENAI, sourceFormat: FORMATS.OPENAI_RESPONSES }));
    const items = chunks.filter((chunk) => chunk.type === "response.output_item.done").map((chunk) => chunk.item);
    expect(items.find((item) => item.type === "reasoning").summary[0].text).toBe("Work it out");
    expect(items.find((item) => item.type === "message").content[0].text).toBe("42");
    const terminal = chunks.find((chunk) => chunk.type === "response.completed").response;
    expect(terminal.output).toEqual(items);
  });
  it.each(["image_url", "input_audio", "file", "redacted_thinking"])("does not flatten arbitrary %s arrays", (type) => {
    const holder = { content: [{ type, text: "opaque", data: "secret" }, { type: "text", text: "answer" }] };
    const original = structuredClone(holder);
    expect(normalizeTypedContent(holder)).toBe(false);
    expect(holder).toEqual(original);
  });
  it("does not expose opaque nested thinking text", () => {
    const holder = { content: [{ type: "thinking", thinking: [{ type: "encrypted", text: "secret" }, { type: "text", text: "safe" }] }, { type: "text", text: "answer" }] };
    normalizeTypedContent(holder);
    expect(holder).toEqual({ content: "answer", reasoning_content: "safe" });
  });
  it("keeps existing readable reasoning ahead of typed thinking", () => {
    const holder = { content: typed(), reasoning: "Earlier. " };
    normalizeTypedContent(holder);
    expect(holder.reasoning_content).toBe("Earlier. Work it out");
    expect(holder.content).toBe("42");
  });
});
