import { describe, expect, it } from "vitest";
import antigravity from "../../open-sse/providers/registry/antigravity.js";
import geminiCli from "../../open-sse/providers/registry/gemini-cli.js";
import { getCapabilitiesForModel, setCatalogSource } from "../../open-sse/providers/capabilities.js";
import { AntigravityExecutor } from "../../open-sse/executors/antigravity.js";

setCatalogSource(null);

describe("Antigravity & Gemini CLI remaining alignments", () => {
  it("includes production fallback endpoints in Antigravity transport.baseUrls", () => {
    expect(antigravity.transport.baseUrls).toContain("https://daily-cloudcode-pa.googleapis.com");
    expect(antigravity.transport.baseUrls).toContain("https://cloudcode-pa.googleapis.com");
    expect(antigravity.transport.baseUrls).toContain("https://daily-cloudcode-pa.sandbox.googleapis.com");
  });

  it("slices multiple tool declarations into individual objects matching Google TPU prefix cache format", () => {
    const ex = new AntigravityExecutor();
    const req = {
      request: {
        contents: [{ role: "user", parts: [{ text: "search and read" }] }],
        tools: [
          {
            functionDeclarations: [
              { name: "tool_a", description: "first tool", parameters: { type: "object", properties: {} } },
              { name: "tool_b", description: "second tool", parameters: { type: "object", properties: {} } },
            ],
          },
        ],
      },
    };
    const transformed = ex.transformRequest("gemini-3.8-flash-high", req, false, {});
    const tools = transformed.request.tools;
    expect(tools).toHaveLength(2);
    expect(tools[0]).toEqual({ functionDeclarations: [expect.objectContaining({ name: "tool_a" })] });
    expect(tools[1]).toEqual({ functionDeclarations: [expect.objectContaining({ name: "tool_b" })] });
  });

  it("resolves gemini-pro-agent with reasoning, multimodal inputs and 65536 max output", () => {
    const caps = getCapabilitiesForModel("antigravity", "gemini-pro-agent");
    expect(caps).toMatchObject({
      reasoning: true,
      thinkingFormat: "gemini-level",
      vision: true,
      audioInput: true,
      videoInput: true,
      pdf: true,
      contextWindow: 1048576,
      maxOutput: 65536,
    });
  });

  it("includes official Gemma 4 models in Gemini CLI registry", () => {
    const ids = geminiCli.models.map((m) => m.id);
    expect(ids).toContain("gemma-4-31b-it");
    expect(ids).toContain("gemma-4-26b-a4b-it");
  });
});
