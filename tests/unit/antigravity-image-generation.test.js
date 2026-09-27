import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import antigravityAdapter from "../../open-sse/handlers/imageProviders/antigravity.js";
import { getExecutor } from "../../open-sse/executors/index.js";

describe("Antigravity Image Adapter & Generation", () => {
  let mockExecutor;

  beforeEach(() => {
    mockExecutor = {
      execute: vi.fn(),
    };
  });

  it("delegates text-to-image request to executor with correct model and prompt directive", async () => {
    const fakeApiResponse = {
      candidates: [
        {
          content: {
            parts: [{ inlineData: { mimeType: "image/png", data: "base64outputpng" } }],
          },
        },
      ],
    };

    mockExecutor.execute.mockResolvedValueOnce({
      response: {
        ok: true,
        status: 200,
        json: async () => fakeApiResponse,
      },
    });

    vi.spyOn(await import("../../open-sse/executors/index.js"), "getExecutor").mockReturnValue(mockExecutor);

    const body = {
      prompt: "A beautiful sunset over mountains",
      size: "1792x1024",
    };
    const credentials = { accessToken: "ya29.test-token" };

    const result = await antigravityAdapter.executeViaExecutor(
      "gemini-3.1-flash-image",
      body,
      credentials,
      null
    );

    expect(mockExecutor.execute).toHaveBeenCalledTimes(1);
    const callArgs = mockExecutor.execute.mock.calls[0][0];

    // Model has aspect ratio suffix appended
    expect(callArgs.model).toBe("gemini-3.1-flash-image-16x9");
    expect(callArgs.stream).toBe(false);

    // Prompt contains directive to generate image
    const parts = callArgs.body.contents[0].parts;
    expect(parts).toHaveLength(1);
    expect(parts[0].text).toContain("Generate an image as the final response.");
    expect(parts[0].text).toContain("A beautiful sunset over mountains");

    // Normalization produces standard OpenAI image response
    const normalized = antigravityAdapter.normalize(result, body.prompt);
    expect(normalized.data).toHaveLength(1);
    expect(normalized.data[0].b64_json).toBe("base64outputpng");
    expect(normalized.created).toBeGreaterThan(0);
  });

  it("supports explicit aspect_ratio parameter", async () => {
    mockExecutor.execute.mockResolvedValueOnce({
      response: {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ inlineData: { data: "img_data" } }] } }],
        }),
      },
    });

    vi.spyOn(await import("../../open-sse/executors/index.js"), "getExecutor").mockReturnValue(mockExecutor);

    await antigravityAdapter.executeViaExecutor(
      "gemini-3.1-flash-image",
      { prompt: "Portrait photo", aspect_ratio: "9:16" },
      { accessToken: "token" },
      null
    );

    const callArgs = mockExecutor.execute.mock.calls[0][0];
    expect(callArgs.model).toBe("gemini-3.1-flash-image-9x16");
  });

  it("handles multi-reference images via body.images array", async () => {
    mockExecutor.execute.mockResolvedValueOnce({
      response: {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ inline_data: { data: "edited_result" } }] } }],
        }),
      },
    });

    vi.spyOn(await import("../../open-sse/executors/index.js"), "getExecutor").mockReturnValue(mockExecutor);

    const body = {
      prompt: "Combine these two styles",
      images: [
        "data:image/png;base64,ref1base64data",
        "data:image/jpeg;base64,ref2base64data",
      ],
    };

    const result = await antigravityAdapter.executeViaExecutor(
      "gemini-3.1-flash-image",
      body,
      { accessToken: "token" },
      null
    );

    const callArgs = mockExecutor.execute.mock.calls[0][0];
    const parts = callArgs.body.contents[0].parts;

    // 2 reference images + 1 prompt text part
    expect(parts).toHaveLength(3);
    expect(parts[0].inlineData).toEqual({ mimeType: "image/png", data: "ref1base64data" });
    expect(parts[1].inlineData).toEqual({ mimeType: "image/jpeg", data: "ref2base64data" });
    expect(parts[2].text).toContain("Use all 2 attached reference images in the result.");

    // Normalizer handles snake_case inline_data as well
    const normalized = antigravityAdapter.normalize(result, body.prompt);
    expect(normalized.data[0].b64_json).toBe("edited_result");
  });

  it("throws descriptive error when Antigravity responds with text instead of image", () => {
    const textOnlyResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: "I cannot fulfill this request due to safety policies." }],
          },
        },
      ],
    };

    expect(() => {
      antigravityAdapter.normalize(textOnlyResponse, "Violating prompt");
    }).toThrow("Antigravity returned text instead of an image: I cannot fulfill this request due to safety policies.");
  });
});
