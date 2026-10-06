import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  saveRequestUsage: vi.fn(async () => {}),
  saveRequestDetail: vi.fn(async () => {}),
  appendRequestLog: vi.fn(async () => {}),
  trackPendingRequest: vi.fn(),
}));
vi.mock("@/lib/usageDb.js", () => db);

import { buildOnStreamComplete, handleStreamingResponse } from "../../open-sse/handlers/chatCore/streamingHandler.js";
import { createStreamController } from "../../open-sse/utils/streamHandler.js";

const encoder = new TextEncoder();
const actual = {
  prompt_tokens: 12, completion_tokens: 16, total_tokens: 28,
  completion_tokens_details: { reasoning_tokens: 16 },
};
const storedUsage = { prompt_tokens: 12, completion_tokens: 16, total_tokens: 28, reasoning_tokens: 16 };
const contentChunk = { choices: [{ delta: { content: "Partial" }, finish_reason: null }] };
const usageChunk = { choices: [], usage: actual };
const network = vi.fn(() => { throw new Error("offline only"); });

function context() {
  return {
    provider: "offline", model: "offline", sourceFormat: "openai-responses", targetFormat: "openai",
    body: { stream: true, messages: [] }, stream: true, connectionId: "offline-conn",
    requestStartTime: Date.now(), clientRawRequest: { endpoint: "/v1/responses" },
  };
}

async function invoke({ close = false, terminal = true, finishReason = "length" } = {}) {
  const chunks = [contentChunk];
  if (terminal) chunks.push({ choices: [{ delta: {}, finish_reason: finishReason }] });
  chunks.push(usageChunk);
  const cancelUpstream = vi.fn();
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(chunks.map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join("")));
      if (close) controller.close();
    },
    cancel: cancelUpstream,
  });
  const ctx = context();
  const callbacks = buildOnStreamComplete(ctx);
  const streamController = createStreamController({ provider: ctx.provider, model: ctx.model });
  const result = await handleStreamingResponse({
    ...ctx, ...callbacks, streamController,
    providerResponse: new Response(body, { headers: { "content-type": "text/event-stream" } }),
  });
  return { response: result.response, callbacks, streamController, cancelUpstream };
}

async function readUntil(reader, marker) {
  const decoder = new TextDecoder();
  let text = "";
  while (!text.includes(marker)) {
    const next = await reader.read();
    if (next.done) throw new Error(`Missing ${marker}`);
    text += decoder.decode(next.value, { stream: true });
  }
  return text;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", network);
});
afterEach(() => {
  expect(network).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

describe("request-level streaming accounting once", () => {
  it.each([["length", "incomplete"], ["stop", "completed"]])(
    "records once when the client cancels after %s terminal but before upstream EOF",
    async (finishReason, event) => {
      const { response, callbacks, streamController, cancelUpstream } = await invoke({ finishReason });
      const reader = response.body.getReader();
      try {
        await readUntil(reader, `event: response.${event}\n`);
        // Accounting must be committed before terminal delivery, not deferred until EOF.
        expect(db.saveRequestUsage).toHaveBeenCalledTimes(1);
      } finally {
        await reader.cancel("client consumed terminal");
      }
      await vi.waitFor(() => expect(cancelUpstream).toHaveBeenCalledTimes(1));
      expect(streamController.signal.aborted).toBe(true);
      expect(db.saveRequestUsage).toHaveBeenCalledTimes(1);
      expect(db.saveRequestUsage.mock.calls[0][0].tokens).toMatchObject(storedUsage);
      expect(db.saveRequestDetail.mock.calls.map(([detail]) => detail.status)).toEqual(["success", "success"]);
      expect(db.saveRequestDetail.mock.calls.every(([detail]) => detail.id === callbacks.streamDetailId)).toBe(true);
    },
  );

  it("records once with actual usage on normal upstream EOF", async () => {
    const { response, streamController, cancelUpstream } = await invoke({ close: true });
    expect(await response.text()).toContain("event: response.incomplete\n");
    expect(db.saveRequestUsage).toHaveBeenCalledTimes(1);
    expect(db.saveRequestUsage.mock.calls[0][0].tokens).toMatchObject(storedUsage);
    expect(db.saveRequestDetail.mock.calls.map(([detail]) => detail.status)).toEqual(["success", "success"]);
    expect(streamController.signal.aborted).toBe(false);
    expect(cancelUpstream).not.toHaveBeenCalled();
  });

  it("records actual preterminal usage once as aborted and cancels upstream", async () => {
    const { response, streamController, cancelUpstream } = await invoke({ terminal: false });
    const reader = response.body.getReader();
    try {
      const text = await readUntil(reader, "Partial");
      expect(text).not.toContain("event: response.incomplete\n");
      expect(db.saveRequestUsage).not.toHaveBeenCalled();
    } finally {
      await reader.cancel("preterminal disconnect");
    }
    await vi.waitFor(() => expect(cancelUpstream).toHaveBeenCalledTimes(1));
    expect(streamController.signal.aborted).toBe(true);
    expect(db.saveRequestUsage).toHaveBeenCalledTimes(1);
    expect(db.saveRequestUsage.mock.calls[0][0].tokens).toMatchObject(storedUsage);
    expect(db.saveRequestDetail.mock.calls.map(([detail]) => detail.status)).toEqual(["success", "aborted"]);
    expect(db.saveRequestDetail.mock.calls[1][0].response.finish_reason).toContain("preterminal disconnect");
  });

  it.each(["complete", "abort"])("ignores duplicate callbacks after %s wins", (first) => {
    const callbacks = buildOnStreamComplete(context());
    const complete = () => callbacks.onStreamComplete({ content: "Partial" }, actual);
    const abort = () => callbacks.onStreamAborted({ content: "Partial", usage: actual }, "client_closed");
    if (first === "complete") complete();
    else abort();
    complete();
    abort();
    complete();
    abort();
    expect(db.saveRequestUsage).toHaveBeenCalledTimes(1);
    expect(db.saveRequestUsage.mock.calls[0][0].tokens).toMatchObject(storedUsage);
    expect(db.saveRequestDetail).toHaveBeenCalledTimes(1);
    expect(db.saveRequestDetail.mock.calls[0][0].status).toBe(first === "complete" ? "success" : "aborted");
  });

  it("claims persistence synchronously before the first write can reenter", () => {
    const callbacks = buildOnStreamComplete(context());
    db.saveRequestDetail.mockImplementationOnce(async () => {
      callbacks.onStreamAborted({ content: "Partial", usage: actual }, "reentrant disconnect");
    });
    callbacks.onStreamComplete({ content: "Partial" }, actual);
    expect(db.saveRequestUsage).toHaveBeenCalledTimes(1);
    expect(db.saveRequestDetail).toHaveBeenCalledTimes(1);
    expect(db.saveRequestDetail.mock.calls[0][0].status).toBe("success");
  });

  it("records separate identical requests independently", () => {
    const first = buildOnStreamComplete(context());
    const second = buildOnStreamComplete(context());
    first.onStreamComplete({ content: "Partial" }, actual);
    second.onStreamAborted({ content: "Partial", usage: actual }, "client_closed");
    expect(db.saveRequestUsage).toHaveBeenCalledTimes(2);
    expect(db.saveRequestDetail.mock.calls.map(([detail]) => detail.id)).toEqual([first.streamDetailId, second.streamDetailId]);
    expect(first.streamDetailId).not.toBe(second.streamDetailId);
    for (const [row] of db.saveRequestUsage.mock.calls) expect(row.tokens).toMatchObject(storedUsage);
  });
});
