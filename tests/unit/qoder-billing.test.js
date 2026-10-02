import { afterEach, describe, expect, it, vi } from "vitest";

const { fetchUpstream } = vi.hoisted(() => ({ fetchUpstream: vi.fn() }));
vi.mock("../../open-sse/utils/proxyFetch.js", () => ({ proxyAwareFetch: fetchUpstream }));
vi.mock("../../open-sse/services/qoderModels.js", () => ({
  getQoderModelConfig: async () => ({ key: "ultimate", max_output_tokens: 4096 }),
  resolveQoderModels: vi.fn(),
  isQoderPat: () => false,
  resolveQoderCredentials: vi.fn(),
}));

import { QoderExecutor } from "../../open-sse/executors/qoder.js";
import { QODER_SSE_PEEK_TIMEOUT_MS, QODER_SSE_PEEK_MAX_BYTES } from "../../open-sse/config/runtimeConfig.js";

const encoder = new TextEncoder();
const frame = (body, statusCodeValue = 200) => `data: ${JSON.stringify({ statusCodeValue, body })}\n\n`;
const answer = { choices: [{ delta: { content: "first 🌍 delta\nsecond line" } }] };

function upstream(chunks, options = {}) {
  return new Response(new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(typeof chunk === "string" ? encoder.encode(chunk) : chunk);
      if (!options.keepOpen) controller.close();
      options.capture?.(controller);
    },
    cancel: options.cancel,
  }), { headers: { "Content-Type": options.contentType || "text/event-stream" } });
}

async function execute(response, signal) {
  fetchUpstream.mockResolvedValueOnce(response);
  return new QoderExecutor().execute({
    model: "ultimate",
    body: { messages: [{ role: "user", content: "hello" }] },
    stream: true,
    credentials: { accessToken: "dt-test", providerSpecificData: { userId: "test-user", machineId: "test-machine" } },
    signal,
  });
}

afterEach(() => {
  fetchUpstream.mockReset();
  vi.useRealTimers();
});

describe("Qoder upstream errors", () => {
  it.each([
    [10605, false], ["10605", false], [10605, true], ["10605", true],
  ])("returns queue code %s (string body: %s) as 429 with precise retry timing", async (code, stringBody) => {
    vi.spyOn(Date, "now").mockReturnValue(1_900_000_000_000);
    try {
      const error = { code, message: "Queue limit", retryAfterSeconds: 30 };
      const result = await execute(upstream([": heartbeat\r\n\r\n", frame(stringBody ? JSON.stringify(error) : error, 403)]));
      expect(result.response.status).toBe(429);
      expect(result.response.headers.get("retry-after")).toBe("30");
      const text = await result.response.text();
      expect(JSON.parse(text).error).toMatchObject({ message: "Queue limit", code });
      expect(new QoderExecutor().parseError(result.response, text)).toMatchObject({ status: 429, resetsAtMs: 1_900_000_030_000 });
    } finally {
      vi.restoreAllMocks();
    }
  });

  it.each([110, "110", 112, "112"])("keeps quota code %s as 403", async (code) => {
    const result = await execute(upstream([frame(JSON.stringify({ code, message: "Quota exhausted" }), 403)]));
    expect(result.response.status).toBe(403);
    expect(result.response.headers.get("retry-after")).toBeNull();
    expect((await result.response.json()).error).toMatchObject({ code, message: "Quota exhausted" });
  });

  it("returns non-billing errors before output as structured HTTP errors", async () => {
    const result = await execute(upstream([frame("service unavailable", 503)]));
    expect(result.response.status).toBe(503);
    expect(await result.response.json()).toMatchObject({ error: { message: "service unavailable" } });
  });

  it("recognizes a raw structured error event without fabricating answer text", async () => {
    const raw = { error: { code: "10605", message: "Queue limit", retryAfterSeconds: "30" } };
    const result = await execute(upstream([`data: ${JSON.stringify(raw)}\n\n`]));
    expect(result.response.status).toBe(429);
    expect(result.response.headers.get("retry-after")).toBe("30");
    expect((await result.response.json()).error).toMatchObject(raw.error);
  });

  it("emits late errors in-band without fabricated assistant content or another request", async () => {
    const result = await execute(upstream([frame(answer), frame({ code: 10605, message: "Queue limit" }, 429), frame({ choices: [{ delta: { content: "must not leak" } }] })]));
    expect(result.response.status).toBe(200);
    const events = (await result.response.text()).split("\n\n").filter((event) => event.startsWith("data: ")).map((event) => event.slice(6));
    expect(JSON.parse(events[0])).toEqual(answer);
    expect(JSON.parse(events[1])).toMatchObject({ error: { message: "Queue limit", code: 10605 } });
    expect(events[2]).toBe("[DONE]");
    expect(events).toHaveLength(3);
    expect(fetchUpstream).toHaveBeenCalledTimes(1);
  });
});

describe("Qoder SSE preheader inspection", () => {
  it("advances comments and blank lines, assembles multiline frames, and preserves split UTF-8", async () => {
    const envelope = JSON.stringify({ statusCodeValue: 200, body: JSON.stringify(answer) });
    const comma = envelope.indexOf(",");
    const bytes = encoder.encode(`: heartbeat\r\n\r\nevent: message\r\ndata: ${envelope.slice(0, comma + 1)}\r\ndata: ${envelope.slice(comma + 1)}\r\n\r\n`);
    const emojiStart = bytes.findIndex((byte) => byte === 0xf0);
    const cancel = vi.fn();
    const result = await execute(upstream([bytes.slice(0, emojiStart + 1), bytes.slice(emojiStart + 1)], { keepOpen: true, cancel }));
    const reader = result.response.body.getReader();
    const first = await reader.read();
    expect(new TextDecoder().decode(first.value)).toBe(`data: ${JSON.stringify(answer)}\n\n`);
    await reader.cancel();
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("hands off a silent pending read at the deadline without dropping its eventual answer", async () => {
    vi.useFakeTimers();
    let controller;
    const pending = execute(upstream([": heartbeat\n\n"], { keepOpen: true, capture: (value) => { controller = value; } }));
    await vi.advanceTimersByTimeAsync(QODER_SSE_PEEK_TIMEOUT_MS + 1);
    const result = await pending;
    controller.enqueue(encoder.encode(frame(answer)));
    controller.close();
    expect(await result.response.text()).toBe(`data: ${JSON.stringify(answer)}\n\ndata: [DONE]\n\n`);
  });

  it("hands off a byte-limited unterminated comment and replays the entire prefix", async () => {
    let controller;
    const prefix = `:${"h".repeat(QODER_SSE_PEEK_MAX_BYTES)}`;
    const result = await execute(upstream([prefix], { keepOpen: true, capture: (value) => { controller = value; } }));
    controller.enqueue(encoder.encode(`\n\n${frame(answer)}`));
    controller.close();
    expect(await result.response.text()).toBe(`data: ${JSON.stringify(answer)}\n\ndata: [DONE]\n\n`);
  });

  it("cancels the upstream reader when the request aborts during a pending peek", async () => {
    const abort = new AbortController();
    const cancel = vi.fn();
    const pending = execute(upstream([], { keepOpen: true, cancel }), abort.signal);
    await vi.waitFor(() => expect(fetchUpstream).toHaveBeenCalledTimes(1));
    abort.abort(new DOMException("cancelled", "AbortError"));
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("bypasses successful JSON responses without reading or rewriting their body", async () => {
    const json = upstream([JSON.stringify(answer)], { contentType: "application/json" });
    const result = await execute(json);
    expect(result.response).toBe(json);
    expect(await result.response.json()).toEqual(answer);
  });
});
