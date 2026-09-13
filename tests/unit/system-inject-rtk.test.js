import { describe, it, expect } from "vitest";
import { injectSystemPrompt } from "../../open-sse/rtk/systemInject.js";
import { FORMATS } from "../../open-sse/translator/formats.js";
import { ROLE } from "../../open-sse/translator/schema/roles.js";

const SEP = "\n\n";
const P1 = "CAVEMAN_TEST_PROMPT_AAA";
const P2 = "PONYTAIL_TEST_PROMPT_BBB";

describe("system-inject chat messages", () => {
  it("appends text block to existing system string with SEP", () => {
    const body = { messages: [{ role: ROLE.SYSTEM, content: "hello" }, { role: ROLE.USER, content: "hi" }] };
    injectSystemPrompt(body, FORMATS.OPENAI, P1);
    expect(body.messages[0].content).toBe(`hello${SEP}${P1}`);
  });

  it("is strictly idempotent — does not duplicate prompt when called twice", () => {
    const body = { messages: [{ role: ROLE.SYSTEM, content: "hello" }, { role: ROLE.USER, content: "hi" }] };
    injectSystemPrompt(body, FORMATS.OPENAI, P1);
    injectSystemPrompt(body, FORMATS.OPENAI, P1);
    expect(body.messages[0].content).toBe(`hello${SEP}${P1}`);
  });

  it("handles Claude array system correctly with cache control", () => {
    const body = {
      system: [
        { type: "text", text: "instruction 1", cache_control: { type: "ephemeral" } },
      ],
    };
    injectSystemPrompt(body, FORMATS.CLAUDE, P1);
    expect(body.system).toHaveLength(2);
    expect(body.system[0].text).toBe(P1);
  });

  it("appends Kiro system prompt to user turn and never writes top-level systemPrompt (#3641)", () => {
    const timeCtx = "[Context: Current time is 2026-01-01T00:00:00.000Z]";
    const tail = "user tail content";
    const historyUserContent = `${timeCtx}${SEP}${tail}`;
    const body = {
      conversationState: {
        history: [{ userInputMessage: { content: historyUserContent, modelId: "m" } }, { assistantResponseMessage: { content: "..." } }],
        currentMessage: { userInputMessage: { content: "current " + tail, modelId: "m" } },
      },
    };
    injectSystemPrompt(body, FORMATS.KIRO, P1);
    expect(body.systemPrompt).toBeUndefined();
    expect(body.conversationState.history[0].userInputMessage.content).toBe(`${historyUserContent}${SEP}${P1}`);
    expect(body.conversationState.currentMessage.userInputMessage.content).toBe("current " + tail);

    // Idempotency: second injection does not duplicate
    injectSystemPrompt(body, FORMATS.KIRO, P1);
    expect(body.conversationState.history[0].userInputMessage.content).toBe(`${historyUserContent}${SEP}${P1}`);
  });
});
