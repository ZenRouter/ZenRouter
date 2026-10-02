import { describe, expect, it } from "vitest";
import "./registerAll.js";
import { translateRequest } from "../../open-sse/translator/index.js";
import { FORMATS } from "../../open-sse/translator/formats.js";
import { OPENAI_BLOCK, CLAUDE_BLOCK, RESPONSES_ITEM } from "../../open-sse/translator/schema/blocks.js";
import { convertOpenAIContentToParts } from "../../open-sse/translator/formats/gemini.js";
import { stripUnsupportedModalities } from "../../open-sse/translator/concerns/modality.js";

describe("Multimodal Translation Pipeline", () => {
  describe("Claude to OpenAI translation", () => {
    it("translates Claude remote image URLs (source.type='url') to OpenAI image_url", () => {
      const body = {
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What is in this image?" },
              { type: "image", source: { type: "url", url: "https://example.com/photo.jpg" } }
            ]
          }
        ]
      };
      const translated = translateRequest(FORMATS.CLAUDE, FORMATS.OPENAI, "gpt-4o", body);
      expect(translated.messages).toHaveLength(1);
      const userMsg = translated.messages[0];
      expect(Array.isArray(userMsg.content)).toBe(true);
      const imgPart = userMsg.content.find(p => p.type === OPENAI_BLOCK.IMAGE_URL);
      expect(imgPart).toBeDefined();
      expect(imgPart.image_url.url).toBe("https://example.com/photo.jpg");
    });

    it("translates Claude base64 document (PDF) to OpenAI file block", () => {
      const body = {
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Read this document:" },
              { type: "document", source: { type: "base64", media_type: "application/pdf", data: "JVBERi0xLjQK" } }
            ]
          }
        ]
      };
      const translated = translateRequest(FORMATS.CLAUDE, FORMATS.OPENAI, "gpt-4o", body);
      expect(translated.messages).toHaveLength(1);
      const userMsg = translated.messages[0];
      expect(Array.isArray(userMsg.content)).toBe(true);
      const filePart = userMsg.content.find(p => p.type === OPENAI_BLOCK.FILE);
      expect(filePart).toBeDefined();
      expect(filePart.file.file_data).toContain("data:application/pdf;base64,JVBERi0xLjQK");
    });

    it("preserves multimodal image blocks inside tool_result content", () => {
      const body = {
        messages: [
          {
            role: "assistant",
            content: [
              { type: "tool_use", id: "call_snap_1", name: "take_screenshot", input: {} }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: "call_snap_1",
                content: [
                  { type: "text", text: "Screenshot captured:" },
                  { type: "image", source: { type: "base64", media_type: "image/png", data: "iVBORw0KGgoAAAANS" } }
                ]
              }
            ]
          }
        ]
      };
      const translated = translateRequest(FORMATS.CLAUDE, FORMATS.OPENAI, "gpt-4o", body);
      // Tool messages and user messages
      const toolMsg = translated.messages.find(m => m.role === "tool");
      expect(toolMsg).toBeDefined();
      expect(toolMsg.content).toBe("Screenshot captured:");
      // Hoisted/appended image part
      const userMsg = translated.messages.find(m => m.role === "user");
      expect(userMsg).toBeDefined();
      const imgBlock = userMsg.content.find(p => p.type === OPENAI_BLOCK.IMAGE_URL);
      expect(imgBlock).toBeDefined();
      expect(imgBlock.image_url.url).toContain("data:image/png;base64,iVBORw0KGgoAAAANS");
    });
  });

  describe("Gemini format multimodal handling", () => {
    it("converts video_url and input_video blocks to Gemini inlineData / fileData", () => {
      const content = [
        { type: "text", text: "Analyze this clip" },
        { type: "video_url", video_url: { url: "data:video/mp4;base64,AAAAHGZ0eXBtcDQy" } },
        { type: "input_video", input_video: { format: "mp4", data: "AAAAHGZ0eXBtcDQy" } },
        { type: "video_url", video_url: { url: "https://example.com/clip.mp4" } }
      ];
      const parts = convertOpenAIContentToParts(content);
      expect(parts).toHaveLength(4);
      expect(parts[0].text).toBe("Analyze this clip");

      // data URI video_url
      expect(parts[1].inlineData).toBeDefined();
      expect(parts[1].inlineData.mime_type).toBe("video/mp4");
      expect(parts[1].inlineData.data).toBe("AAAAHGZ0eXBtcDQy");

      // input_video
      expect(parts[2].inlineData).toBeDefined();
      expect(parts[2].inlineData.mime_type).toBe("video/mp4");
      expect(parts[2].inlineData.data).toBe("AAAAHGZ0eXBtcDQy");
      // remote URL video_url
      expect(parts[3].fileData).toBeDefined();
      expect(parts[3].fileData.fileUri).toBe("https://example.com/clip.mp4");
      expect(parts[3].fileData.mimeType).toBe("video/mp4");
    });

    it("uses canonical mime_type on inlineData across image, audio, and pdf", () => {
      const content = [
        { type: "image_url", image_url: { url: "data:image/jpeg;base64,/9j/4AAQSkZJRg==" } },
        { type: "input_audio", input_audio: { format: "wav", data: "UklGRiQAAABXQVZF" } },
        { type: "file", file: { file_data: "data:application/pdf;base64,JVBERi0xLjQK" } }
      ];
      const parts = convertOpenAIContentToParts(content);
      for (const p of parts) {
        expect(p.inlineData).toBeDefined();
        expect(p.inlineData.mime_type).toBeDefined();
        expect(typeof p.inlineData.mime_type).toBe("string");
      }
    });
  });

  describe("Modality stripping for videoInput", () => {
    it("strips video blocks when model lacks videoInput capability", () => {
      const body = {
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Look at this video" },
              { type: "video_url", video_url: { url: "data:video/mp4;base64,AAAA" } }
            ]
          }
        ]
      };
      const caps = { vision: true, pdf: true, audioInput: true, videoInput: false };
      const stripped = stripUnsupportedModalities(body, FORMATS.OPENAI, caps);
      expect(stripped).toBe(true);
      const textParts = body.messages[0].content.filter(p => p.type === "text");
      expect(textParts.some(p => p.text.includes("[video omitted: model has no video support]"))).toBe(true);
    });
  });

  describe("Responses API file block preservation", () => {
    it("converts Chat Completions file block into Responses input_file item", () => {
      const body = {
        model: "gpt-5-codex",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Here is the PDF:" },
              { type: "file", file: { file_data: "data:application/pdf;base64,JVBERi0xLjQK", filename: "report.pdf" } }
            ]
          }
        ]
      };
      const translated = translateRequest(FORMATS.OPENAI, FORMATS.OPENAI_RESPONSES, "gpt-5-codex", body);
      expect(translated.input).toBeDefined();
      const userItem = translated.input.find(i => i.role === "user");
      expect(userItem).toBeDefined();
      const filePart = userItem.content.find(p => p.type === RESPONSES_ITEM.INPUT_FILE);
      expect(filePart).toBeDefined();
      expect(filePart.file_data).toBe("data:application/pdf;base64,JVBERi0xLjQK");
      expect(filePart.filename).toBe("report.pdf");
    });
  });
});
