import { describe, expect, it } from "vitest";
import { handleComboChat } from "open-sse/services/combo.js";

function sse(text) {
  return new Response(text, { headers: { "Content-Type": "text/event-stream" } });
}

describe("combo empty stream fallback (#3463)", () => {
  it("tries the next model after a fast empty SSE response", async () => {
    const calls = [];
    const result = await handleComboChat({
      body: { model: "combo", stream: true },
      models: ["first/model", "second/model"],
      comboStrategy: "fallback",
      log: { info() {}, warn() {} },
      handleSingleModel: async (_body, model) => {
        calls.push(model);
        return model.startsWith("first") ? sse("data: [DONE]\n\n") : sse("data: {\"choices\":[{\"delta\":{\"content\":\"ok\"}}]}\n\ndata: [DONE]\n\n");
      },
    });

    expect(calls).toEqual(["first/model", "second/model"]);
    expect(result.ok).toBe(true);
  });
});