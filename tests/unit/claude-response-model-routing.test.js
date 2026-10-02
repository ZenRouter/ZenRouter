import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/usageDb.js", () => ({
  trackPendingRequest: vi.fn(),
  appendRequestLog: vi.fn(async () => {}),
  saveRequestDetail: vi.fn(async () => {}),
  saveUsageStats: vi.fn(async () => {}),
}));

const { handleStreamingResponse } = await import("../../open-sse/handlers/chatCore/streamingHandler.js");
const { canonicalizeUsage } = await import("../../open-sse/utils/usageTracking.js");

describe("Claude response model routing (PR #4513)", () => {
  it("reports the exact client-selected model in message_start for a routed stream", async () => {
    const upstream = [
      "event: response.output_text.delta",
      `data: ${JSON.stringify({ type: "response.output_text.delta", delta: "ok" })}`,
      "",
      "event: response.completed",
      `data: ${JSON.stringify({ type: "response.completed", response: { status: "completed" } })}`,
      "",
    ].join("\n");

    const result = await handleStreamingResponse({
      providerResponse: new Response(upstream, { headers: { "content-type": "text/event-stream" } }),
      provider: "codex",
      model: "gpt-5.6-sol",
      sourceFormat: "claude",
      targetFormat: "openai-responses",
      body: { model: "codex/gpt-5.6-sol", stream: true, messages: [{ role: "user", content: "hi" }] },
      clientRawRequest: { body: { model: "cx/gpt-5.6-sol" } },
      streamController: {
        signal: new AbortController().signal,
        isConnected: () => true,
        handleComplete: vi.fn(),
        handleError: vi.fn(),
        handleDisconnect: vi.fn(),
        abort: vi.fn(),
      },
    });

    const output = await result.response.text();
    const messageStart = output
      .split("\n")
      .find((line) => line.startsWith("data: ") && line.includes('"type":"message_start"'));

    expect(messageStart).toBeDefined();
    expect(JSON.parse(messageStart.slice(6)).message.model).toBe("cx/gpt-5.6-sol");
  });
});

describe("Usage canonicalization reasoning preservation (PR #4536)", () => {
  it("extracts reasoning tokens from nested completion_tokens_details and output_tokens_details", () => {
    const fromOpenAI = canonicalizeUsage({
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30,
      completion_tokens_details: { reasoning_tokens: 15 }
    });
    expect(fromOpenAI.reasoning_tokens).toBe(15);
    expect(fromOpenAI.completion_tokens).toBe(20);

    const fromResponses = canonicalizeUsage({
      input_tokens: 10,
      output_tokens: 25,
      total_tokens: 35,
      output_tokens_details: { reasoning_tokens: 18 }
    });
    expect(fromResponses.reasoning_tokens).toBe(18);
    expect(fromResponses.completion_tokens).toBe(25);
  });
});
