import { describe, it, expect } from "vitest";
import { normalizeKiroToolSpecs } from "../../open-sse/translator/concerns/kiroConversation.js";

describe("Kiro Tool Schema Combinator Flattening (#3641)", () => {
  it("flattens anyOf, oneOf, allOf, and type arrays into valid object schemas", () => {
    const inputTools = [
      {
        type: "function",
        function: {
          name: "complex_tool",
          description: "Tool with combinators",
          parameters: {
            $schema: "http://json-schema.org/draft-07/schema#",
            title: "ComplexToolParams",
            type: "object",
            additionalProperties: false,
            allOf: [
              {
                properties: {
                  base_field: { type: "string", description: "Base field" },
                  optional_field: { type: ["string", "null"], description: "Nullable field" }
                },
                required: ["base_field"]
              },
              {
                properties: {
                  target_mode: {
                    anyOf: [
                      { type: "string", enum: ["fast", "precise"] },
                      { type: "null" }
                    ]
                  },
                  nested_obj: {
                    type: "object",
                    additionalProperties: false,
                    oneOf: [
                      {
                        properties: {
                          file_path: { type: "string" }
                        },
                        required: ["file_path"]
                      },
                      { type: "null" }
                    ]
                  }
                }
              }
            ]
          }
        }
      }
    ];

    const { specs, nameMap } = normalizeKiroToolSpecs(inputTools);

    expect(specs).toHaveLength(1);
    expect(nameMap.get("complex_tool")).toBe("complex_tool");

    const spec = specs[0].toolSpecification;
    expect(spec.name).toBe("complex_tool");
    expect(spec.description).toBe("Tool with combinators");

    const schema = spec.inputSchema.json;
    expect(schema.type).toBe("object");
    expect(schema.$schema).toBeUndefined();
    expect(schema.title).toBeUndefined();
    expect(schema.additionalProperties).toBeUndefined();
    expect(schema.allOf).toBeUndefined();

    // Verify allOf fields merged
    expect(schema.properties.base_field).toBeDefined();
    expect(schema.properties.base_field.type).toBe("string");

    // Verify type array flattened
    expect(schema.properties.optional_field.type).toBe("string");

    // Verify anyOf flattened
    expect(schema.properties.target_mode.type).toBe("string");
    expect(schema.properties.target_mode.enum).toEqual(["fast", "precise"]);
    expect(schema.properties.target_mode.anyOf).toBeUndefined();

    // Verify nested oneOf flattened
    expect(schema.properties.nested_obj.properties.file_path.type).toBe("string");
    expect(schema.properties.nested_obj.oneOf).toBeUndefined();
    expect(schema.properties.nested_obj.additionalProperties).toBeUndefined();

    // Verify required fields
    expect(schema.required).toContain("base_field");
  });
});
