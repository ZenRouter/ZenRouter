import { describe, expect, it } from "vitest";
import { FORMATS } from "open-sse/translator/formats.js";
import { handleForcedSSEToJson } from "open-sse/handlers/chatCore/sseToJsonHandler.js";

describe("Claude forced-SSE JSON response (#3495)", () => {
  it("returns an Anthropic Message for a Chat Completions SSE upstream", async () => {
    const encoder = new TextEncoder();
    const raw = 'data: {"id":"chatcmpl-1","choices":[{"delta":{"content":"ok"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n';
    const result = await handleForcedSSEToJson({
      providerResponse: new Response(new ReadableStream({ start(controller) { controller.enqueue(encoder.encode(raw)); controller.close(); } }), { headers: { "content-type": "text/event-stream" } }),
      sourceFormat: FORMATS.CLAUDE,
      targetFormat: FORMATS.OPENAI,
      provider: "test-chat",
      model: "test-model",
      body: { model: "test-model", stream: false },
      stream: false,
      requestStartTime: Date.now(),
      connectionId: "test-connection",
      clientRawRequest: { endpoint: "/v1/messages" },
      trackDone() {},
      appendLog() {},
    });
    const json = await result.response.json();
    expect(json).toMatchObject({ type: "message", role: "assistant", stop_reason: "end_turn" });
    expect(json.content).toEqual([{ type: "text", text: "ok" }]);
    expect(json).not.toHaveProperty("choices");
  });
});