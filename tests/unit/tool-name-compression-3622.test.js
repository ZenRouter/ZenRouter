import { describe, it, expect } from "vitest";
import {
  compressSingleToolName,
  compressToolNames,
  decloakOpenAIChunk,
  MAX_TOOL_NAME_LENGTH,
} from "../../open-sse/utils/toolCompressor.js";
import { FORMATS } from "../../open-sse/translator/formats.js";

describe("Tool Name Compression for Length Limits (#3622, PR #3637)", () => {
  const longName1 = "mcp__cloudflare_observability_plugin__search_logs_by_filter_and_timestamp_range_query_v1";
  const longName2 = "mcp__cloudflare_observability_plugin__search_logs_by_filter_and_timestamp_range_query_v2";
  const normalName = "get_weather";

  it("compresses tool names > 64 chars to exactly 64 chars without prefix collision", () => {
    expect(longName1.length).toBeGreaterThan(64);
    expect(longName2.length).toBeGreaterThan(64);

    const compressed1 = compressSingleToolName(longName1);
    const compressed2 = compressSingleToolName(longName2);

    expect(compressed1.length).toBe(MAX_TOOL_NAME_LENGTH);
    expect(compressed2.length).toBe(MAX_TOOL_NAME_LENGTH);
    // Even though first 55 characters are identical, MD5 suffix prevents collision
    expect(compressed1).not.toEqual(compressed2);
    expect(compressed1.startsWith(longName1.slice(0, 55))).toBe(true);

    // Normal names remain untouched
    expect(compressSingleToolName(normalName)).toBe(normalName);
  });

  it("compresses tools and historical messages in OpenAI format", () => {
    const body = {
      tools: [
        { type: "function", function: { name: normalName } },
        { type: "function", function: { name: longName1 } },
      ],
      messages: [
        { role: "user", content: "Check logs" },
        {
          role: "assistant",
          tool_calls: [
            { id: "call_1", type: "function", function: { name: longName1, arguments: "{}" } },
          ],
        },
        { role: "tool", name: longName1, content: "ok" },
      ],
      tool_choice: { type: "function", function: { name: longName1 } },
    };

    const { body: compressed, toolNameMap } = compressToolNames(FORMATS.OPENAI, body);

    expect(toolNameMap).toBeDefined();
    expect(toolNameMap.size).toBe(1);

    const compressedName = Array.from(toolNameMap.keys())[0];
    expect(toolNameMap.get(compressedName)).toBe(longName1);

    // Tool list updated
    expect(compressed.tools[0].function.name).toBe(normalName);
    expect(compressed.tools[1].function.name).toBe(compressedName);

    // Message history updated
    expect(compressed.messages[1].tool_calls[0].function.name).toBe(compressedName);
    expect(compressed.messages[2].name).toBe(compressedName);

    // Tool choice updated
    expect(compressed.tool_choice.function.name).toBe(compressedName);
  });

  it("compresses tools and historical messages in Claude format", () => {
    const body = {
      tools: [
        { name: normalName, input_schema: {} },
        { name: longName2, input_schema: {} },
      ],
      messages: [
        { role: "user", content: "Run" },
        {
          role: "assistant",
          content: [
            { type: "text", text: "calling tool" },
            { type: "tool_use", id: "tu_1", name: longName2, input: {} },
          ],
        },
      ],
      tool_choice: { type: "tool", name: longName2 },
    };

    const { body: compressed, toolNameMap } = compressToolNames(FORMATS.CLAUDE, body);

    expect(toolNameMap.size).toBe(1);
    const compressedName = Array.from(toolNameMap.keys())[0];
    expect(toolNameMap.get(compressedName)).toBe(longName2);

    expect(compressed.tools[1].name).toBe(compressedName);
    expect(compressed.messages[1].content[1].name).toBe(compressedName);
    expect(compressed.tool_choice.name).toBe(compressedName);
  });

  it("decloaks OpenAI streaming and non-streaming chunks back to original long name", () => {
    const shortName = compressSingleToolName(longName1);
    const toolNameMap = new Map([[shortName, longName1]]);

    // Streaming delta chunk
    const streamingChunk = {
      choices: [
        {
          delta: {
            tool_calls: [
              { index: 0, function: { name: shortName } },
            ],
          },
        },
      ],
    };
    const decloakedStream = decloakOpenAIChunk(streamingChunk, toolNameMap);
    expect(decloakedStream.choices[0].delta.tool_calls[0].function.name).toBe(longName1);

    // Non-streaming completion
    const nonStreamingBody = {
      choices: [
        {
          message: {
            role: "assistant",
            tool_calls: [
              { id: "call_1", type: "function", function: { name: shortName, arguments: "{}" } },
            ],
          },
        },
      ],
    };
    const decloakedBody = decloakOpenAIChunk(nonStreamingBody, toolNameMap);
    expect(decloakedBody.choices[0].message.tool_calls[0].function.name).toBe(longName1);
  });
});
