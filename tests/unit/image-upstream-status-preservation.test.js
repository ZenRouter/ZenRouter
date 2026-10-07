// Regression: image generation must preserve the real upstream status instead of
// flattening every executor failure into 502. A 404 NOT_FOUND is a model/project
// problem, not a transient credential fault; reporting 502 makes accountFallback
// cool down healthy pooled accounts (observed: all 15 Antigravity accounts locked
// on `gemini-3-pro-image`).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleImageGenerationCore } from "../../open-sse/handlers/imageGenerationCore.js";

function adapterReturning(executorError) {
  return {
    useExecutor: true,
    executeViaExecutor: vi.fn().mockRejectedValue(executorError),
    normalize: (body) => body,
  };
}

describe("image generation upstream status preservation", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("keeps a 404 NOT_FOUND result as 404 rather than 502", async () => {
    const notFound = new Error('{\n  "error": {\n    "code": 404,\n    "message": "Requested entity was not found.",\n    "status": "NOT_FOUND"\n  }\n}');
    notFound.status = 404;
    notFound.upstreamStatus = 404;

    vi.doMock("../../open-sse/handlers/imageProviders/index.js", () => ({
      getImageAdapter: () => adapterReturning(notFound),
    }));

    const { handleImageGenerationCore: core } = await import("../../open-sse/handlers/imageGenerationCore.js");
    const result = await core({
      body: { prompt: "a cute cat" },
      modelInfo: { provider: "antigravity", model: "gemini-3-pro-image" },
      credentials: { accessToken: "fixture" },
      log: null,
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe(404);
  });

  it("still reports 502 for a genuine transport failure with no upstream status", async () => {
    const transport = new Error("fetch failed");
    vi.doMock("../../open-sse/handlers/imageProviders/index.js", () => ({
      getImageAdapter: () => adapterReturning(transport),
    }));

    const { handleImageGenerationCore: core } = await import("../../open-sse/handlers/imageGenerationCore.js");
    const result = await core({
      body: { prompt: "a cute cat" },
      modelInfo: { provider: "antigravity", model: "gemini-3.1-flash-image" },
      credentials: { accessToken: "fixture" },
      log: null,
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe(502);
  });
});