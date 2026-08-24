import { describe, expect, it } from "vitest";
import { FORMATS } from "open-sse/translator/formats.js";
import { translateNonStreamingResponse } from "open-sse/handlers/chatCore/nonStreamingHandler.js";

describe("Anthropic non-stream response format (#3462)", () => {
  it("converts OpenAI-shaped upstream JSON even when the target was labeled Claude", () => {
    const result = translateNonStreamingResponse({
      id: "chatcmpl-1",
      object: "chat.completion",
      model: "gpt-test",
      choices: [{ message: { role: "assistant", content: "<block>no</block>" }, finish_reason: "stop" }],
      usage: { prompt_tokens: 10, completion_tokens: 2 },
    }, FORMATS.CLAUDE, FORMATS.CLAUDE);

    expect(result).toMatchObject({ type: "message", role: "assistant", stop_reason: "end_turn" });
    expect(result.content).toEqual([{ type: "text", text: "<block>no</block>" }]);
    expect(result).not.toHaveProperty("choices");
  });
});