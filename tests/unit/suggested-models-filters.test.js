import { describe, it, expect } from "vitest";
import { FILTERS } from "@/app/api/providers/suggested-models/filters.js";

describe("suggested models filters", () => {
  it("filters out dead opencode free models like deepseek-v4-flash-free", () => {
    const raw = [
      { id: "big-pickle" },
      { id: "deepseek-v4-flash-free" },
      { id: "gpt-4o-mini-free" },
      { id: "other-paid-model" },
    ];

    const result = FILTERS["opencode-free"](raw);
    const ids = result.map(m => m.id);

    expect(ids).toContain("big-pickle");
    expect(ids).toContain("gpt-4o-mini-free");
    expect(ids).not.toContain("deepseek-v4-flash-free");
    expect(ids).not.toContain("other-paid-model");
  });

  it("filters openrouter-free models with zero prompt and completion pricing", () => {
    const raw = [
      { id: "free-model-1", name: "Free 1", pricing: { prompt: "0", completion: "0" }, context_length: 250000 },
      { id: "free-model-small", name: "Free Small", pricing: { prompt: "0", completion: "0" }, context_length: 100000 },
      { id: "paid-model", name: "Paid", pricing: { prompt: "0.5", completion: "1" }, context_length: 250000 },
    ];

    const result = FILTERS["openrouter-free"](raw);
    expect(result).toEqual([
      { id: "free-model-1", name: "Free 1", contextLength: 250000 },
    ]);
  });
});
