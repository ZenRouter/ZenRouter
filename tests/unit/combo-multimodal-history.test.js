import { describe, it, expect, vi } from "vitest";
import {
  detectRequiredCapabilities,
  stripMultimodalContent,
  handleFusionChat,
} from "../../open-sse/services/combo.js";

const mockLog = { info: () => {}, warn: () => {}, debug: () => {}, error: () => {} };

function okResponse(content) {
  const json = { choices: [{ message: { role: "assistant", content } }] };
  const make = () => ({ ok: true, status: 200, clone: make, json: async () => json });
  return make();
}

describe("detectRequiredCapabilities - Multi-turn Conversation History", () => {
  it("detects vision when image was sent in turn 1 and turn 2 is text-only follow-up (OpenAI format)", () => {
    const body = {
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: "https://example.com/cat.jpg" } },
            { type: "text", text: "What animal is in this image?" },
          ],
        },
        {
          role: "assistant",
          content: "This is a domestic tabby cat sitting on a rug.",
        },
        {
          role: "user",
          content: "What color is its fur?",
        },
      ],
    };

    const caps = detectRequiredCapabilities(body);
    expect(caps.has("vision")).toBe(true);
  });

  it("detects pdf when document was sent in turn 1 and turn 2 is text-only follow-up", () => {
    const body = {
      messages: [
        {
          role: "user",
          content: [
            { type: "file", file: { file_data: "data:application/pdf;base64,JVBERi0xLjQK..." } },
            { type: "text", text: "Read this contract." },
          ],
        },
        {
          role: "assistant",
          content: "I have read the contract.",
        },
        {
          role: "user",
          content: "What are the termination conditions?",
        },
      ],
    };

    const caps = detectRequiredCapabilities(body);
    expect(caps.has("pdf")).toBe(true);
  });

  it("detects audioInput and videoInput across conversation turns", () => {
    const audioBody = {
      messages: [
        {
          role: "user",
          content: [
            { type: "input_audio", input_audio: { data: "base64data", format: "wav" } },
          ],
        },
        { role: "assistant", content: "I heard the audio." },
        { role: "user", content: "Can you transcribe the second speaker?" },
      ],
    };
    expect(detectRequiredCapabilities(audioBody).has("audioInput")).toBe(true);

    const videoBody = {
      messages: [
        {
          role: "user",
          content: [
            { type: "input_video", video_url: { url: "https://example.com/sample.mp4" } },
          ],
        },
        { role: "assistant", content: "Video received." },
        { role: "user", content: "What happened at 00:15?" },
      ],
    };
    expect(detectRequiredCapabilities(videoBody).has("videoInput")).toBe(true);
  });

  it("detects vision from tool_result in OpenAI format across history", () => {
    const body = {
      messages: [
        { role: "user", content: "Take a screenshot of the homepage." },
        {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_shot_1",
              type: "function",
              function: { name: "take_screenshot", arguments: "{}" },
            },
          ],
        },
        {
          role: "tool",
          tool_call_id: "call_shot_1",
          content: [
            { type: "image_url", image_url: { url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==" } },
          ],
        },
        { role: "assistant", content: "Here is the screenshot." },
        { role: "user", content: "Is the logo centered properly?" },
      ],
    };

    const caps = detectRequiredCapabilities(body);
    expect(caps.has("vision")).toBe(true);
  });

  it("detects vision from Claude-style tool_result block in user turn", () => {
    const body = {
      messages: [
        { role: "user", content: "Run inspection tool." },
        {
          role: "assistant",
          content: [{ type: "tool_use", id: "tu_inspect", name: "capture", input: {} }],
        },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: "tu_inspect",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/png",
                    data: "iVBORw0KGgoAAAANSUhEUg==",
                  },
                },
              ],
            },
          ],
        },
        { role: "assistant", content: "Inspection completed." },
        { role: "user", content: "What defects did it show?" },
      ],
    };

    const caps = detectRequiredCapabilities(body);
    expect(caps.has("vision")).toBe(true);
  });

  it("detects vision across multi-turn Responses API input (body.input)", () => {
    const body = {
      input: [
        {
          type: "message",
          role: "user",
          content: [
            { type: "input_image", image_url: "https://example.com/spec.png" },
            { type: "input_text", text: "Analyze this diagram" },
          ],
        },
        {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: "The diagram shows a microservices architecture." }],
        },
        {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: "How does service A talk to service B?" }],
        },
      ],
    };

    const caps = detectRequiredCapabilities(body);
    expect(caps.has("vision")).toBe(true);
  });

  it("detects vision across multi-turn Gemini contents (body.contents)", () => {
    const body = {
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: "base64data" } },
            { text: "What is in this picture?" },
          ],
        },
        {
          role: "model",
          parts: [{ text: "It is an ancient Roman coin." }],
        },
        {
          role: "user",
          parts: [{ text: "What emperor is depicted on it?" }],
        },
      ],
    };

    const caps = detectRequiredCapabilities(body);
    expect(caps.has("vision")).toBe(true);
  });

  it("detects vision from Ollama / Hermes images property in earlier user turns", () => {
    const body = {
      messages: [
        {
          role: "user",
          content: "Look at this image",
          images: ["iVBORw0KGgoAAAANSUhEUg=="],
        },
        { role: "assistant", content: "I see a blue bird." },
        { role: "user", content: "What species is it?" },
      ],
    };

    const caps = detectRequiredCapabilities(body);
    expect(caps.has("vision")).toBe(true);
  });

  it("does not falsely trigger media capabilities for text-only multi-turn conversations", () => {
    const body = {
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello! Tell me a joke." },
        { role: "assistant", content: "Why did the scarecrow win an award? Because he was outstanding in his field!" },
        { role: "user", content: "Explain why that is funny." },
      ],
    };

    const caps = detectRequiredCapabilities(body);
    expect(caps.size).toBe(0);
  });

  it("preserves tools and search detection alongside history media", () => {
    const body = {
      messages: [
        {
          role: "user",
          content: [{ type: "image_url", image_url: { url: "https://example.com/flag.png" } }],
        },
        { role: "assistant", content: "This is a flag." },
        { role: "user", content: "Find the history of this country online." },
      ],
      tools: [{ type: "web_search" }],
    };

    const caps = detectRequiredCapabilities(body);
    expect(caps.has("vision")).toBe(true);
    expect(caps.has("search")).toBe(true);
  });
});

describe("stripMultimodalContent - Media Stripping for Judge", () => {
  it("strips image_url from OpenAI messages leaving text content intact", () => {
    const body = {
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: "https://example.com/cat.jpg" } },
            { type: "text", text: "What animal is this?" },
          ],
        },
      ],
    };

    const stripped = stripMultimodalContent(body);
    expect(stripped.messages[0].content).toHaveLength(1);
    expect(stripped.messages[0].content[0]).toEqual({ type: "text", text: "What animal is this?" });
    // Verify original body was not mutated
    expect(body.messages[0].content).toHaveLength(2);
  });

  it("strips Claude-format image content blocks leaving text", () => {
    const body = {
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/png", data: "iVBORw0KGgo=" },
            },
            { type: "text", text: "Analyze this image" },
          ],
        },
      ],
    };

    const stripped = stripMultimodalContent(body);
    expect(stripped.messages[0].content).toHaveLength(1);
    expect(stripped.messages[0].content[0]).toEqual({ type: "text", text: "Analyze this image" });
  });

  it("strips PDF file blocks from messages", () => {
    const body = {
      messages: [
        {
          role: "user",
          content: [
            { type: "file", file: { file_data: "data:application/pdf;base64,JVBERi..." } },
            { type: "text", text: "Summarize this document" },
          ],
        },
      ],
    };

    const stripped = stripMultimodalContent(body);
    expect(stripped.messages[0].content).toHaveLength(1);
    expect(stripped.messages[0].content[0]).toEqual({ type: "text", text: "Summarize this document" });
  });

  it("replaces entirely media messages with placeholder text so message is never empty", () => {
    const body = {
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: "https://example.com/photo.png" } },
          ],
        },
      ],
    };

    const stripped = stripMultimodalContent(body);
    expect(stripped.messages[0].content).toEqual([{ type: "text", text: "[media omitted]" }]);
  });

  it("strips Ollama images array and message-level image/audio fields", () => {
    const body = {
      messages: [
        {
          role: "user",
          content: "Describe the image",
          images: ["base64img"],
          image_url: "https://example.com/pic.png",
          audio_url: "https://example.com/sound.mp3",
        },
      ],
    };

    const stripped = stripMultimodalContent(body);
    expect(stripped.messages[0].images).toBeUndefined();
    expect(stripped.messages[0].image_url).toBeUndefined();
    expect(stripped.messages[0].audio_url).toBeUndefined();
    expect(stripped.messages[0].content).toBe("Describe the image");
  });

  it("cleans inlineData and fileData parts from Gemini contents", () => {
    const body = {
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/png", data: "base64" } },
            { text: "What is this?" },
          ],
        },
      ],
    };

    const stripped = stripMultimodalContent(body);
    expect(stripped.contents[0].parts).toHaveLength(1);
    expect(stripped.contents[0].parts[0]).toEqual({ text: "What is this?" });
  });

  it("cleans input_image from Responses API input array", () => {
    const body = {
      input: [
        {
          type: "message",
          role: "user",
          content: [
            { type: "input_image", image_url: "https://example.com/photo.jpg" },
            { type: "input_text", text: "Process this" },
          ],
        },
      ],
    };

    const stripped = stripMultimodalContent(body);
    expect(stripped.input[0].content).toHaveLength(1);
    expect(stripped.input[0].content[0]).toEqual({ type: "input_text", text: "Process this" });
  });

  it("cleans embedded data URIs from string contents", () => {
    const body = {
      messages: [
        {
          role: "user",
          content: "Here is the image data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA for your review.",
        },
      ],
    };

    const stripped = stripMultimodalContent(body);
    expect(stripped.messages[0].content).toContain("[media omitted]");
    expect(stripped.messages[0].content).not.toContain("data:image/png;base64");
  });

  it("strips media from tool_result content blocks", () => {
    const body = {
      messages: [
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: "call_123",
              content: [
                { type: "image", source: { type: "base64", media_type: "image/png", data: "x" } },
                { type: "text", text: "Screen captured successfully." },
              ],
            },
          ],
        },
      ],
    };

    const stripped = stripMultimodalContent(body);
    const toolResult = stripped.messages[0].content[0];
    expect(toolResult.type).toBe("tool_result");
    expect(toolResult.content).toHaveLength(1);
    expect(toolResult.content[0]).toEqual({ type: "text", text: "Screen captured successfully." });
  });
});

describe("handleFusionChat - Multimodal Handling & Upstream Issue #3375", () => {
  it("filters panel models during fan-out so text-only models are excluded from media requests", async () => {
    const seenModels = [];
    const handleSingleModel = vi.fn(async (_body, model, _isPanel) => {
      seenModels.push(model);
      if (model === "judge/synthesis") return okResponse("FINAL SYNTHESIS");
      return okResponse(`Answer from ${model}`);
    });

    const body = {
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: "https://example.com/chart.png" } },
            { type: "text", text: "Explain this sales chart." },
          ],
        },
      ],
    };

    // deepseek-chat has vision: false
    // claude-sonnet-4.6 and gpt-4o have vision: true
    await handleFusionChat({
      body,
      models: [
        "deepseek/deepseek-chat",
        "anthropic/claude-sonnet-4.6",
        "openai/gpt-4o",
      ],
      handleSingleModel,
      log: mockLog,
      judgeModel: "judge/synthesis",
    });

    // Panel fan-out should ONLY include the vision-capable models (sonnet + gpt-4o)
    const panelCalls = seenModels.filter((m) => m !== "judge/synthesis");
    expect(panelCalls).toContain("anthropic/claude-sonnet-4.6");
    expect(panelCalls).toContain("openai/gpt-4o");
    expect(panelCalls).not.toContain("deepseek/deepseek-chat");
  });

  it("answers directly without fusion when only one panel model supports the required media modality", async () => {
    const seenModels = [];
    const handleSingleModel = vi.fn(async (_body, model) => {
      seenModels.push(model);
      return okResponse(`Direct answer from ${model}`);
    });

    const body = {
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: "https://example.com/photo.jpg" } },
            { type: "text", text: "What is this?" },
          ],
        },
      ],
    };

    // deepseek-chat = text-only; claude-sonnet-4.6 = vision
    await handleFusionChat({
      body,
      models: ["deepseek/deepseek-chat", "anthropic/claude-sonnet-4.6"],
      handleSingleModel,
      log: mockLog,
    });

    // Since deepseek-chat is filtered out, only claude-sonnet-4.6 remains (length 1)
    // and answers directly without attempting to fan out or crash deepseek
    expect(handleSingleModel).toHaveBeenCalledTimes(1);
    expect(seenModels).toEqual(["anthropic/claude-sonnet-4.6"]);
  });

  it("strips multimodal content from judgeBody before dispatching to text-only judgeModel", async () => {
    let capturedJudgeBody = null;
    const handleSingleModel = vi.fn(async (body, model, isPanel) => {
      if (model === "deepseek/deepseek-chat" && !isPanel) {
        capturedJudgeBody = body;
        return okResponse("Synthesized answer by DeepSeek judge");
      }
      return okResponse(`Panel answer from ${model}`);
    });

    const body = {
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: "https://example.com/cat.jpg" } },
            { type: "text", text: "What breed of cat is this?" },
          ],
        },
      ],
    };

    await handleFusionChat({
      body,
      models: ["anthropic/claude-sonnet-4.6", "openai/gpt-4o"],
      handleSingleModel,
      log: mockLog,
      judgeModel: "deepseek/deepseek-chat",
    });

    expect(capturedJudgeBody).toBeDefined();
    // The first user message in judgeBody must have image_url stripped
    const userMsg = capturedJudgeBody.messages[0];
    expect(userMsg.content).toHaveLength(1);
    expect(userMsg.content[0]).toEqual({ type: "text", text: "What breed of cat is this?" });

    // The appended judge synthesis prompt must be present
    const judgePromptMsg = capturedJudgeBody.messages.at(-1);
    expect(judgePromptMsg.role).toBe("user");
    expect(judgePromptMsg.content).toContain("=== PANEL RESPONSES ===");
    expect(judgePromptMsg.content).toContain("Panel answer from anthropic/claude-sonnet-4.6");
    expect(judgePromptMsg.content).toContain("Panel answer from openai/gpt-4o");
  });
});
