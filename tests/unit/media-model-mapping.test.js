import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchProviderLiveModels, normalizeLiveModel, clearProviderLiveModelsCache } from "@/shared/utils/providerLiveModels.js";
import { getProvidersByKind } from "@/shared/constants/providers.js";
import { getModelsByProviderId } from "open-sse/config/providerModels.js";
import { AI_MODELS, getModelKind } from "@/shared/constants/models.js";
import { modelKind } from "open-sse/providers/models/schema.js";
import { handleImageGenerationCore } from "open-sse/handlers/imageGenerationCore.js";

afterEach(() => { vi.unstubAllGlobals(); clearProviderLiveModelsCache(); });

describe("media catalog mapping", () => {
  it("lists xAI and OpenRouter in Text to Image with image models", () => {
    const providers = getProvidersByKind("image").map((p) => p.id);
    expect(providers).toContain("xai");
    expect(providers).toContain("openrouter");
    expect(getModelsByProviderId("xai").filter((m) => modelKind(m) === "image").map((m) => m.id))
      .toEqual(["grok-imagine-image-2.0", "grok-imagine-image", "grok-imagine-image-quality"]);
  });

  it("separates all Imagine IDs from the reported live catalog from chat", () => {
    const ids = ["grok-imagine-image", "grok-imagine-image-2.0", "grok-imagine-image-quality", "grok-imagine-video-1.5", "grok-imagine-video-1.5-lite"];
    expect(ids.map((id) => getModelKind(normalizeLiveModel("xai", { id }), "llm")))
      .toEqual(["image", "image", "image", "video", "video"]);
    const registered = getModelsByProviderId("xai");
    for (const id of ids) {
      expect(registered.some((m) => m.id === id)).toBe(true);
      expect(AI_MODELS.some((m) => m.provider === "xai" && m.model === id)).toBe(false);
    }
    expect(getProvidersByKind("video").some((p) => p.id === "xai")).toBe(true);
  });

  it("keeps registry media kinds when upstream returns only IDs", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ data: [
      { id: "grok-imagine-image-2.0" }, { id: "grok-imagine-image" },
      { id: "grok-imagine-video" }, { id: "grok-4.7" },
    ] })));
    const models = await fetchProviderLiveModels("xai", "test-key", { useCache: false });
    expect(models.map(modelKind)).toEqual(["image", "image", "video", "llm"]);
  });

  it("corrects legacy custom Grok image rows and excludes media from the chat picker", () => {
    expect(getModelKind({ providerAlias: "xai", id: "grok-imagine-image", type: "llm" })).toBe("image");
    expect(AI_MODELS.some((m) => m.model === "grok-imagine-image-2.0")).toBe(false);
    expect(AI_MODELS.some((m) => m.model === "grok-imagine-video")).toBe(false);
    expect(AI_MODELS.some((m) => m.model === "grok-4.7")).toBe(true);
  });

  it("classifies new image outputs while keeping image-input chat models as LLM", () => {
    expect(normalizeLiveModel("openrouter", { id: "new-generator", architecture: { output_modalities: ["text", "image"] } }).kind).toBe("image");
    expect(modelKind(normalizeLiveModel("openrouter", { id: "vision-chat", architecture: { input_modalities: ["image", "text"], output_modalities: ["text"] } }))).toBe("llm");
    expect(modelKind({ id: "grok-imagine-image-next" })).toBe("image");
    expect(modelKind({ id: "whisper-1" })).toBe("stt");
    expect(modelKind({ id: "text-embedding-3-small" })).toBe("embedding");
    expect(modelKind({ id: "gpt-audio" })).toBe("llm");
    expect(modelKind({ id: "composer", kind: "music" })).toBe("music");
  });

  it.each(["grok-imagine-image-2.0", "grok-imagine-image"])("routes %s to xAI image generation with supported fields", async (model) => {
    const fetchMock = vi.fn(async () => Response.json({ data: [{ url: "https://example.test/image.png" }] }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await handleImageGenerationCore({
      body: { prompt: "a cat", n: 2, aspect_ratio: "16:9", resolution: "2k", quality: "medium", size: "auto", background: "transparent" },
      modelInfo: { provider: "xai", model }, credentials: { apiKey: "test-key" },
    });
    expect(result.success).toBe(true);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.x.ai/v1/images/generations");
    expect(options.headers.Authorization).toBe("Bearer test-key");
    expect(JSON.parse(options.body)).toEqual({ model, prompt: "a cat", n: 2, aspect_ratio: "16:9", resolution: "2k", ...(model.endsWith("2.0") ? { quality: "medium" } : {}) });
  });

  it("connects TokenRouter's declared image endpoint to its adapter", async () => {
    const fetchMock = vi.fn(async () => Response.json({ data: [{ b64_json: "YWJj" }] }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await handleImageGenerationCore({ body: { prompt: "a cat" }, modelInfo: { provider: "tokenrouter", model: "bytedance-seed/seedream-5.0-pro" }, credentials: { apiKey: "test-key" } });
    expect(result.success).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.tokenrouter.com/v1/images/generations");
  });
});
