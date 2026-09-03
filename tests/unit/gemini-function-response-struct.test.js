import { describe, it, expect } from "vitest";
import { openaiToGeminiRequest, openaiToAntigravityRequest } from "../../open-sse/translator/request/openai-to-gemini.js";

describe("Gemini functionResponse Struct Wrapping (#3318)", () => {
  it("wraps JSON array tool responses into { result: [...] } object for Protobuf Struct compatibility", () => {
    const body = {
      model: "gemini-2.5-flash",
      messages: [
        { role: "user", content: "List items" },
        {
          role: "assistant",
          tool_calls: [
            { id: "call_list", type: "function", function: { name: "get_items", arguments: "{}" } },
          ],
        },
        {
          role: "tool",
          tool_call_id: "call_list",
          content: '[{"id": 1, "name": "itemA"}, {"id": 2, "name": "itemB"}]',
        },
      ],
    };

    const out = openaiToGeminiRequest("gemini-2.5-flash", body, false);
    const contents = out.contents;
    const toolTurn = contents.find((turn) => turn.parts?.some((p) => p.functionResponse));
    expect(toolTurn).toBeDefined();

    const fnResp = toolTurn.parts[0].functionResponse;
    expect(fnResp.name).toBe("get_items");
    // Must be a valid JSON Object, not an Array directly
    expect(Array.isArray(fnResp.response)).toBe(false);
    expect(typeof fnResp.response).toBe("object");
    expect(fnResp.response).toHaveProperty("result");
    expect(fnResp.response.result).toEqual([
      { id: 1, name: "itemA" },
      { id: 2, name: "itemB" },
    ]);
  });

  it("passes JSON object tool responses directly without double-wrapping in { result: { ... } }", () => {
    const body = {
      model: "gemini-2.5-flash",
      messages: [
        { role: "user", content: "Get status" },
        {
          role: "assistant",
          tool_calls: [
            { id: "call_stat", type: "function", function: { name: "get_status", arguments: "{}" } },
          ],
        },
        {
          role: "tool",
          tool_call_id: "call_stat",
          content: '{"status": "healthy", "uptime": 3600}',
        },
      ],
    };

    const out = openaiToGeminiRequest("gemini-2.5-flash", body, false);
    const contents = out.contents;
    const toolTurn = contents.find((turn) => turn.parts?.some((p) => p.functionResponse));
    const fnResp = toolTurn.parts[0].functionResponse;

    expect(fnResp.response).toEqual({
      status: "healthy",
      uptime: 3600,
    });
  });

  it("preserves empty string tool responses as { result: '' }", () => {
    const body = {
      model: "gemini-2.5-flash",
      messages: [
        { role: "user", content: "Run empty cmd" },
        {
          role: "assistant",
          tool_calls: [
            { id: "call_empty", type: "function", function: { name: "run_cmd", arguments: "{}" } },
          ],
        },
        {
          role: "tool",
          tool_call_id: "call_empty",
          content: "",
        },
      ],
    };

    const out = openaiToGeminiRequest("gemini-2.5-flash", body, false);
    const contents = out.contents;
    const toolTurn = contents.find((turn) => turn.parts?.some((p) => p.functionResponse));
    expect(toolTurn).toBeDefined();

    const fnResp = toolTurn.parts[0].functionResponse;
    expect(fnResp.response).toEqual({ result: "" });
  });

  it("handles Claude models via Antigravity with JSON array tool responses", () => {
    const claudeStyleOnAntigravity = {
      model: "claude-sonnet-4-20250514",
      messages: [
        { role: "user", content: "Run query" },
        {
          role: "assistant",
          tool_calls: [
            { id: "tu_1", type: "function", function: { name: "fetch_data", arguments: "{}" } },
          ],
        },
        {
          role: "tool",
          tool_call_id: "tu_1",
          content: '[{"key": "val"}]',
        },
      ],
    };

    const out = openaiToAntigravityRequest("claude-sonnet-4-20250514", claudeStyleOnAntigravity, false, { projectId: "p-1" });
    const contents = out.request.contents;
    const toolTurn = contents.find((turn) => turn.parts?.some((p) => p.functionResponse));
    expect(toolTurn).toBeDefined();

    const fnResp = toolTurn.parts[0].functionResponse;
    expect(fnResp.name).toBe("fetch_data");
    expect(Array.isArray(fnResp.response)).toBe(false);
    expect(fnResp.response).toEqual({ result: [{ key: "val" }] });
  });
});
