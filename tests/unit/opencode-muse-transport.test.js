import { describe, expect, it, vi, beforeEach } from "vitest";

// Capture the outbound request so we can assert what the executor actually
// sends over the wire.
const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("../../open-sse/utils/proxyFetch.js", () => ({
  proxyAwareFetch: (...args) => fetchMock(...args),
}));

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

describe("OpenCode muse end-to-end (#3509 regression)", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: "resp_1" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));
  });

  it("execute() strips max_tokens family from the wire body for muse models", async () => {
    const executor = new OpenCodeExecutor();
    const result = await executor.execute({
      model: "muse-spark-1.2-contributor-free",
      stream: false,
      credentials: { providerSpecificData: {} },
      body: {
        model: "muse-spark-1.2-contributor-free",
        max_tokens: 4096,
        max_completion_tokens: 4096,
        messages: [{ role: "user", content: "hi" }],
      },
    });

    expect(result.response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url.endsWith("/zen/v1/responses")).toBe(true);
    const wire = JSON.parse(init.body);
    expect(wire.max_tokens).toBeUndefined();
    expect(wire.max_completion_tokens).toBeUndefined();
    expect(wire.messages).toHaveLength(1);
  });

  it("execute() keeps max_tokens on the wire for non-muse models", async () => {
    const executor = new OpenCodeExecutor();
    await executor.execute({
      model: "some-chat-model",
      stream: false,
      credentials: { providerSpecificData: {} },
      body: {
        model: "some-chat-model",
        max_tokens: 4096,
        messages: [{ role: "user", content: "hi" }],
      },
    });

    const [, init] = fetchMock.mock.calls[0];
    const wire = JSON.parse(init.body);
    expect(wire.max_tokens).toBe(4096);
  });
});
