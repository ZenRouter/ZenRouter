import { describe, it, expect } from "vitest";
import { openaiResponsesToOpenAIRequest } from "../../open-sse/translator/request/openai-responses.js";
import { convertResponsesApiFormat } from "../../open-sse/translator/formats/responsesApi.js";
import { ensureToolCallIds } from "../../open-sse/translator/concerns/toolCall.js";

const TOOLS = [{
  type: "function", name: "exec_command", description: "run a command",
  parameters: { type: "object", properties: { cmd: { type: "string" } }, required: ["cmd"] },
}];
const user = (text) => ({ type: "message", role: "user", content: [{ type: "input_text", text }] });
const call = (callId) => ({
  type: "function_call", name: "exec_command", arguments: JSON.stringify({ cmd: "ls" }),
  ...(callId ? { call_id: callId } : {}),
});
const toolMessages = (body) => body.messages.filter((m) => m.role === "tool");
const serializedToolIds = (body) => JSON.parse(JSON.stringify(body)).messages
  .filter((m) => m.role === "tool").map((m) => m.tool_call_id);

describe("Responses tool output without call_id (#4091)", () => {
  it("pairs missing output call_id with the pending function_call", () => {
    const body = openaiResponsesToOpenAIRequest("m", {
      input: [user("run"), call("call_abc"), { type: "function_call_output", output: "ok" }], tools: TOOLS,
    }, false, {});
    expect(toolMessages(body)).toHaveLength(1);
    expect(serializedToolIds(body)).toEqual(["call_abc"]);
  });

  it("keeps ids consistent when the function_call lost call_id too", () => {
    const body = openaiResponsesToOpenAIRequest("m", {
      input: [user("run"), call(), { type: "function_call_output", output: "ok" }], tools: TOOLS,
    }, false, {});
    const assistantId = body.messages.find((m) => m.tool_calls)?.tool_calls[0].id;
    expect(typeof assistantId).toBe("string");
    expect(serializedToolIds(body)).toEqual([assistantId]);
  });

  it("preserves parallel outputs in order", () => {
    const body = openaiResponsesToOpenAIRequest("m", {
      input: [user("run two"), call("call_1"), call("call_2"),
        { type: "function_call_output", output: "first" },
        { type: "function_call_output", output: "second" }], tools: TOOLS,
    }, false, {});
    expect(toolMessages(body).map((m) => [m.tool_call_id, m.content])).toEqual([
      ["call_1", "first"], ["call_2", "second"],
    ]);
  });

  it("drops true orphan output instead of emitting an invalid tool message", () => {
    const body = openaiResponsesToOpenAIRequest("m", {
      input: [user("hi"), { type: "function_call_output", output: "late" }], tools: TOOLS,
    }, false, {});
    expect(toolMessages(body)).toHaveLength(0);
    expect(JSON.stringify(body.messages)).not.toContain("late");
  });

  it("repairs custom_tool_call_output too", () => {
    const body = openaiResponsesToOpenAIRequest("m", {
      input: [user("patch"), { type: "custom_tool_call", name: "apply_patch", input: "patch" },
        { type: "custom_tool_call_output", output: "Done" }],
      tools: [{ type: "custom", name: "apply_patch", description: "patch" }],
    }, false, {});
    const assistantId = body.messages.find((m) => m.tool_calls)?.tool_calls[0].id;
    expect(serializedToolIds(body)).toEqual([assistantId]);
  });

  it("repairs the duplicate responsesHandler converter", () => {
    const body = convertResponsesApiFormat({
      input: [user("run"), call("call_abc"), { type: "function_call_output", output: "ok" }], tools: TOOLS,
    });
    expect(serializedToolIds(body)).toEqual(["call_abc"]);
  });

  it("ensureToolCallIds repairs chat tool messages missing their id", () => {
    const body = ensureToolCallIds({ messages: [
      { role: "assistant", content: null, tool_calls: [
        { id: "call_chat_1", type: "function", function: { name: "echo", arguments: "{}" } },
      ] },
      { role: "tool", content: "result" },
    ] });
    expect(toolMessages(body)[0].tool_call_id).toBe("call_chat_1");
  });

  it("downgrades an unpairable chat-style tool item to user context", () => {
    const body = openaiResponsesToOpenAIRequest("m", {
      input: [{ role: "tool", content: "orphan chat tool" }], tools: TOOLS,
    }, false, {});
    expect(toolMessages(body)).toHaveLength(0);
    expect(body.messages[0].role).toBe("user");
    expect(body.messages[0].content).toContain("orphan chat tool");
  });
});
