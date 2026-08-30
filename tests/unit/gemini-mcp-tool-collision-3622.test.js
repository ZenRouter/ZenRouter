import { describe, expect, it } from "vitest";
import { openaiToGeminiRequest, openaiToAntigravityRequest } from "../../open-sse/translator/request/openai-to-gemini.js";
import { geminiToOpenAIResponse } from "../../open-sse/translator/response/gemini-to-openai.js";

describe("Gemini long MCP tool name disambiguation (#3622)", () => {
  it("disambiguates two distinct long tool names with identical prefixes", () => {
    const longName1 = "mcp__plugin_code-analyzer_local-server__find_and_replace_occurrences_in_file_1";
    const longName2 = "mcp__plugin_code-analyzer_local-server__find_and_replace_occurrences_in_file_2";

    const body = {
      messages: [{ role: "user", content: "Run analysis" }],
      tools: [
        {
          type: "function",
          function: {
            name: longName1,
            description: "Tool 1",
            parameters: { type: "object", properties: { path: { type: "string" } } }
          }
        },
        {
          type: "function",
          function: {
            name: longName2,
            description: "Tool 2",
            parameters: { type: "object", properties: { path: { type: "string" } } }
          }
        }
      ]
    };

    const result = openaiToGeminiRequest("gemini-2.5-pro", body, true);
    const fns = result.tools[0].functionDeclarations;

    expect(fns).toHaveLength(2);
    expect(fns[0].name).not.toBe(fns[1].name);
    expect(fns[0].name.length).toBeLessThanOrEqual(64);
    expect(fns[1].name.length).toBeLessThanOrEqual(64);

    expect(result._toolNameMap).toBeDefined();
    expect(result._toolNameMap.get(fns[0].name)).toBe(longName1);
    expect(result._toolNameMap.get(fns[1].name)).toBe(longName2);
  });

  it("restores original tool name in geminiToOpenAIResponse via _toolNameMap", () => {
    const originalName = "mcp__plugin_foo_super_long_custom_mcp_server__query_database_tables_for_schema";
    const body = {
      messages: [{ role: "user", content: "Query DB" }],
      tools: [
        {
          type: "function",
          function: {
            name: originalName,
            description: "Query",
            parameters: { type: "object", properties: {} }
          }
        }
      ]
    };

    const reqResult = openaiToGeminiRequest("gemini-2.5-pro", body, true);
    const sanitizedName = reqResult.tools[0].functionDeclarations[0].name;

    const state = {
      toolNameMap: reqResult._toolNameMap
    };

    const chunk = {
      response: {
        modelVersion: "gemini-2.5-pro",
        candidates: [
          {
            content: {
              parts: [
                {
                  functionCall: {
                    name: sanitizedName,
                    args: { query: "SELECT 1" }
                  }
                }
              ]
            }
          }
        ]
      }
    };

    const converted = geminiToOpenAIResponse(chunk, state);
    const toolCall = converted.find(c => c.choices?.[0]?.delta?.tool_calls)?.choices[0].delta.tool_calls[0];

    expect(toolCall).toBeDefined();
    expect(toolCall.function.name).toBe(originalName);
  });

  it("handles Claude-format payload in Antigravity envelope with long tool names", () => {
    const longToolName = "mcp__plugin_workspace-manager_local-server__execute_complex_workflow_action";
    const body = {
      model: "claude-3-7-sonnet-20250219",
      messages: [
        { role: "user", content: "Run tool" }
      ],
      tools: [
        {
          name: longToolName,
          description: "Action",
          input_schema: { type: "object", properties: {} }
        }
      ]
    };

    const envelope = openaiToAntigravityRequest("claude-3-7-sonnet-20250219", body, true, {
      projectId: "test-proj",
      connectionId: "conn-1"
    });

    const fns = envelope.request.tools[0].functionDeclarations;
    expect(fns).toHaveLength(1);
    expect(fns[0].name.length).toBeLessThanOrEqual(64);
    expect(envelope._toolNameMap).toBeDefined();
    expect(envelope._toolNameMap.get(fns[0].name)).toBe(longToolName);
  });
});
