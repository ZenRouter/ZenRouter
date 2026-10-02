import { describe, expect, it } from "vitest";
import { checkFallbackError } from "../../open-sse/services/accountFallback.js";
import { CodexExecutor } from "../../open-sse/executors/codex.js";

describe("Codex ChatGPT account model restriction and fallback (#4369)", () => {
  it("treats HTTP 400 with ChatGPT account error as fallback-eligible with 0ms cooldown", () => {
    const errorText = JSON.stringify({
      detail: "The 'gpt-5.6-sol' model is not supported when using Codex with a ChatGPT account.",
    });

    const res = checkFallbackError(400, errorText);
    expect(res.shouldFallback).toBe(true);
    expect(res.cooldownMs).toBe(0);
  });

  it("detects response.failed in SSE peek as account fallback", async () => {
    const executor = new CodexExecutor();
    const sseBody = [
      'event: response.created\ndata: {"id":"resp_1"}\n\n',
      'event: response.failed\ndata: {"response":{"error":{"message":"The model is at capacity"}}}\n\n',
    ].join("");

    const response = new Response(sseBody, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });

    const peek = await executor._peekSseTransientError(response);
    expect(peek.matched).toBe("response.failed");
    expect(peek.accountFallback).toBe(true);
  });
});
