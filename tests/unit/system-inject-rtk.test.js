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
});
