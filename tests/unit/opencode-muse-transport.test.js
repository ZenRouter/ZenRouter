import { describe, expect, it } from "vitest";
import { OpenCodeExecutor } from "../../open-sse/executors/opencode.js";
import { stripUnsupportedParams } from "../../open-sse/translator/concerns/paramSupport.js";

describe("OpenCode muse transport (#3509)", () => {
  it("routes muse models to /zen/v1/responses", () => {
    const executor = new OpenCodeExecutor();
    const url = executor.buildUrl("muse-experiment");
    expect(url.endsWith("/zen/v1/responses")).toBe(true);
  });

  it("strips max_tokens for muse models on OpenCode", () => {
    const body = {
      model: "muse-experiment",
      max_tokens: 4096,
      max_completion_tokens: 4096,
      max_output_tokens: 4096,
      messages: [{ role: "user", content: "hi" }],
    };
    stripUnsupportedParams("opencode", "muse-experiment", body);
    expect(body.max_tokens).toBeUndefined();
    expect(body.max_completion_tokens).toBeUndefined();
    expect(body.max_output_tokens).toBeUndefined();
  });

  it("preserves max_tokens for non-muse OpenCode models", () => {
    const body = {
      model: "big-pickle",
      max_tokens: 4096,
      messages: [{ role: "user", content: "hi" }],
    };
    stripUnsupportedParams("opencode", "big-pickle", body);
    expect(body.max_tokens).toBe(4096);
  });
});
