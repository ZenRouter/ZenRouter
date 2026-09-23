import { describe, it, expect } from "vitest";
import { claudeToOpenAIResponse } from "../../open-sse/translator/response/claude-to-openai.js";
import {
  buildAbortedResponsesTerminalBytes,
  formatIncompleteOpenAIResponsesStreamFailure,
} from "../../open-sse/utils/responsesStreamHelpers.js";

const freshState = () => ({ toolCalls: new Map(), toolNameMap: new Map() });

describe("claude-to-openai — mid-stream error events", () => {
  it("surfaces an upstream error event instead of swallowing it", () => {
    const out = claudeToOpenAIResponse(
      { type: "error", error: { type: "overloaded_error", message: "Overloaded" } },
      freshState()
    );
    expect(out).not.toBeNull();
    expect(out.length).toBe(2);
    const text = JSON.stringify(out);
    expect(text).toContain("overloaded_error");
    expect(text).toContain("Overloaded");
    // terminal STOP chunk present
    expect(text).toContain('"finish_reason":"stop"');
  });

  it("marks finish sent so a later message_stop does not double-emit", () => {
    const state = freshState();
    claudeToOpenAIResponse({ type: "error", error: { message: "boom" } }, state);
    expect(state.finishReasonSent).toBe(true);
    const after = claudeToOpenAIResponse({ type: "message_stop" }, state);
    expect(after).toBeNull();
  });

  it("ignores ping keepalives (no client-visible chunks)", () => {
    expect(claudeToOpenAIResponse({ type: "ping" }, freshState())).toBeNull();
  });
});

describe("aborted Responses terminal bytes carry the abort cause", () => {
  it("embeds a provided stall message", () => {
    const text = new TextDecoder().decode(
      buildAbortedResponsesTerminalBytes("stream stall timeout (360000ms)")
    );
    expect(text).toContain("response.failed");
    expect(text).toContain("stream stall timeout (360000ms)");
    expect(text).toContain("[DONE]");
  });

  it("defaults to the generic message when none is given", () => {
    const text = new TextDecoder().decode(buildAbortedResponsesTerminalBytes());
    expect(text).toContain("stream closed before response.completed");
  });

  it("formatIncompleteOpenAIResponsesStreamFailure keeps its default shape", () => {
    expect(formatIncompleteOpenAIResponsesStreamFailure()).toContain("response.failed");
  });
});
