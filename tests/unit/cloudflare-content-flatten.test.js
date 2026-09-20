import { describe, expect, it } from "vitest";
import { stripUnsupportedParams } from "../../open-sse/translator/concerns/paramSupport.js";
import { parseModel } from "../../open-sse/services/model.js";

describe("Cloudflare Workers AI message normalization (#1926, #4180)", () => {
  it("resolves @cf prefix as cloudflare-ai provider", () => {
    const parsed = parseModel("@cf/deepseek-ai/deepseek-r1-distill-qwen-32b");
    expect(parsed.provider).toBe("cloudflare-ai");
  });

  it("flattens array content parts into a single string", () => {
    const body = {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Hello " },
            { type: "input_text", text: "world" },
          ],
        },
      ],
    };
    stripUnsupportedParams("cloudflare-ai", "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", body);
    expect(body.messages[0].content).toBe("Hello world");
  });

  it("ensures content is a string when null or undefined and rewrites tool role to user", () => {
    const body = {
      messages: [
        { role: "user", content: "Hi" },
        { role: "assistant", tool_calls: [{ id: "c1", type: "function" }], content: null },
        { role: "tool", tool_call_id: "c1", content: "Result" },
      ],
    };
    stripUnsupportedParams("cloudflare-ai", "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", body);
    expect(body.messages[1].content).toBe("");
    expect(body.messages[1].role).toBe("assistant");
    expect(body.messages[2].role).toBe("user");
    expect(body.messages[2].content).toBe("Result");
  });
});
