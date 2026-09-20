import { describe, expect, it } from "vitest";
import { normalizeClaudeInputSchema } from "../../open-sse/translator/request/openai-to-claude.js";

describe("Claude tool input_schema normalization (#4075)", () => {
  it("enforces type: 'object' when input_schema has only anyOf at top level", () => {
    const raw = {
      anyOf: [
        { type: "object", properties: { file_path: { type: "string" } } },
        { type: "object", properties: { pattern: { type: "string" } } },
      ],
    };
    const normalized = normalizeClaudeInputSchema(raw);
    expect(normalized.type).toBe("object");
    expect(normalized.properties.file_path).toBeDefined();
    expect(normalized.properties.pattern).toBeDefined();
  });

  it("handles empty or missing schema safely", () => {
    expect(normalizeClaudeInputSchema(null)).toEqual({ type: "object", properties: {}, required: [] });
    expect(normalizeClaudeInputSchema({})).toEqual({ type: "object", properties: {} });
  });

  it("leaves standard object schema intact", () => {
    const standard = {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    };
    const normalized = normalizeClaudeInputSchema(standard);
    expect(normalized.type).toBe("object");
    expect(normalized.properties.query).toEqual({ type: "string" });
    expect(normalized.required).toEqual(["query"]);
  });
});
