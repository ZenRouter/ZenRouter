import { describe, expect, it } from "vitest";
import "../translator/registerAll.js";
import { translateRequest, translateResponse } from "../../open-sse/translator/index.js";
import { FORMATS } from "../../open-sse/translator/formats.js";

describe("Claude Code auto-mode safeguards passthrough (#4173)", () => {
  it("preserves safeguards in Claude -> OpenAI -> Claude translation", () => {
    const safeguards = [{ type: "prompt_injection", action: "block" }];
    const claudeReq = {
      model: "claude-3-5-sonnet",
      messages: [{ role: "user", content: "hello" }],
      safeguards,
    };

    const toOpenAI = translateRequest(FORMATS.CLAUDE, FORMATS.OPENAI, "claude-3-5-sonnet", claudeReq);
    expect(toOpenAI.safeguards).toEqual(safeguards);

    const backToClaude = translateRequest(FORMATS.OPENAI, FORMATS.CLAUDE, "claude-3-5-sonnet", toOpenAI);
    expect(backToClaude.safeguards).toEqual(safeguards);
  });

  it("preserves safeguard_results in Claude -> OpenAI response translation", () => {
    const state = { messageId: "msg_1", model: "claude-3-5-sonnet" };
    const safeguardResults = [{ type: "prompt_injection", triggered: false }];
    const chunk = {
      type: "message_delta",
      delta: { stop_reason: "end_turn", safeguard_results: safeguardResults },
    };

    const translated = translateResponse(FORMATS.CLAUDE, FORMATS.OPENAI, chunk, state);
    expect(translated).not.toBeNull();
    const finalChunk = Array.isArray(translated) ? translated[0] : translated;
    expect(finalChunk.safeguard_results).toEqual(safeguardResults);
  });
});
