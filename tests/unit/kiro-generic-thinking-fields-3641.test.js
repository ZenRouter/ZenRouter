import { describe, it, expect } from "vitest";
import { translateRequest } from "../../open-sse/translator/index.js";
import { KiroExecutor } from "../../open-sse/executors/kiro.js";

const CREDS = { providerSpecificData: {} };

function kiroBodyFrom(sourceFormat, body, model = "claude-sonnet-4.5") {
  return translateRequest(sourceFormat, "kiro", model, body, false, CREDS, "kiro");
}

describe("Kiro rejects generic thinking fields (#3641, #3746, #3749)", () => {
  it("strips top-level thinking fields left by a Responses client", () => {
    const payload = kiroBodyFrom("openai-responses", {
      model: "claude-sonnet-4.5",
      input: [{ type: "message", role: "user", content: [{ type: "input_text", text: "hi" }] }],
      reasoning: { effort: "medium" },
    });

    const sent = new KiroExecutor().transformRequest("claude-sonnet-4.5", payload, false, CREDS);
    expect(sent.thinking).toBeUndefined();
    expect(sent.reasoning).toBeUndefined();
    expect(sent.reasoning_effort).toBeUndefined();
    expect(sent.output_config).toBeUndefined();
    expect(sent.conversationState).toBeDefined();
    expect(sent.agentMode).toBe("vibe");
  });

  it("strips generic thinking fields for a Gemini client", () => {
    const payload = kiroBodyFrom("gemini", {
      contents: [{ role: "user", parts: [{ text: "hi" }] }],
      generationConfig: { thinkingConfig: { thinkingBudget: 4096 } },
    });

    const sent = new KiroExecutor().transformRequest("claude-sonnet-4.5", payload, false, CREDS);
    expect(sent.thinking).toBeUndefined();
    expect(sent.thinkingConfig).toBeUndefined();
    expect(sent.enable_thinking).toBeUndefined();
  });
});
