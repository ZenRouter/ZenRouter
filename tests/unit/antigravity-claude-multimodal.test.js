import { describe, it, expect } from "vitest";
import { openaiToAntigravityRequest } from "../../open-sse/translator/request/openai-to-gemini.js";
import { claudeToOpenAIRequest } from "../../open-sse/translator/request/claude-to-openai.js";

describe("Antigravity Claude multimodal (images & documents) (#3968)", () => {
  it("converts Claude document (base64) to OpenAI file block in claudeToOpenAIRequest", () => {
    const claudeReq = {
      model: "claude-sonnet-4-6",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "read doc" },
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: "JVBERi0xLjQK..." },
            },
          ],
        },
      ],
    };

    const openaiReq = claudeToOpenAIRequest("claude-sonnet-4-6", claudeReq, false);
    const userMsg = openaiReq.messages[0];
    expect(Array.isArray(userMsg.content)).toBe(true);
    const docPart = userMsg.content.find((p) => p.type === "file");
    expect(docPart).toBeDefined();
    expect(docPart.file.file_data).toContain("data:application/pdf;base64,JVBERi0xLjQK...");
  });

  it("converts Claude image and document blocks to Gemini inlineData in wrapInCloudCodeEnvelopeForClaude", () => {
    const body = {
      model: "claude-opus-4-6-thinking",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "inspect this" },
            {
              type: "image_url",
              image_url: { url: "data:image/png;base64,iVBORw0KGgoAAA..." },
            },
            {
              type: "file",
              file: { file_data: "data:application/pdf;base64,JVBERi0xLjQK..." },
            },
          ],
        },
      ],
    };

    const envelope = openaiToAntigravityRequest("ag/claude-opus-4-6-thinking", body, false, {
      projectId: "proj-1",
    });

    const parts = envelope.request.contents[0].parts;
    expect(parts.some((p) => p.text === "inspect this")).toBe(true);

    const imagePart = parts.find((p) => p.inlineData?.mimeType === "image/png");
    expect(imagePart).toBeDefined();
    expect(imagePart.inlineData.data).toBe("iVBORw0KGgoAAA...");

    const docPart = parts.find((p) => p.inlineData?.mimeType === "application/pdf");
    expect(docPart).toBeDefined();
    expect(docPart.inlineData.data).toBe("JVBERi0xLjQK...");
  });
});
