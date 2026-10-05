import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPricingForModel as price } from "../../open-sse/providers/pricing.js";

const store = vi.hoisted(() => ({ value: {}, getAll: vi.fn(), write: vi.fn(() => { throw Error("Unexpected DB write"); }) }));
vi.mock("../../src/lib/db/helpers/kvStore.js", () => ({ makeKv: () => ({ getAll: store.getAll, clear: store.write }) }));
vi.mock("../../src/lib/db/driver.js", () => ({ getAdapter: store.write }));
beforeEach(() => { vi.resetModules(); store.value = {}; store.getAll.mockImplementation(async () => store.value); store.write.mockClear(); });

describe("saved pricing metadata merge", () => {
  it("merges partial saved rates identically for billing and display without writing storage", async () => {
    const model = "deepseek/deepseek-v4-pro";
    store.value = { tr: { [model]: { input: 9 } } };
    const before = structuredClone(store.value);
    const repo = await import("../../src/lib/db/repos/pricingRepo.js");
    const expected = { ...price("tokenrouter", model), input: 9 };
    expect(await repo.getPricingForModel("tokenrouter", model)).toEqual(expected);
    expect(await repo.getPricingForModel("tr", model)).toEqual(expected);
    const displayed = await repo.getPricing();
    expect(displayed.tokenrouter[model]).toEqual(expected);
    expect(displayed.tr[model]).toEqual(expected);
    expect(store.value).toEqual(before);
    expect(store.write).not.toHaveBeenCalled();
  });

  it("honors the exact saved token over conflicting aliases and inherits only static missing fields", async () => {
    const model = "gpt-5.3-codex";
    store.value = { gh: { [model]: { input: 9, output: 99 } }, github: { [model]: { input: 7 } } };
    const repo = await import("../../src/lib/db/repos/pricingRepo.js");
    const canonical = { ...price("github", model), input: 7 };
    const alias = { ...price("gh", model), input: 9, output: 99, reasoning: 99 };
    expect(await repo.getPricingForModel("github", model)).toEqual(canonical);
    expect(await repo.getPricingForModel("gh", model)).toEqual(alias);
    const displayed = await repo.getPricing();
    expect(displayed.github[model]).toEqual(canonical);
    expect(displayed.gh[model]).toEqual(alias);
    expect(store.write).not.toHaveBeenCalled();
  });

  it("recognizes legacy gh saved tariffs from canonical github billing", async () => {
    store.value = { gh: { "gpt-5.3-codex": { input: 9, output: 99 } } };
    const repo = await import("../../src/lib/db/repos/pricingRepo.js");
    const expected = { ...price("github", "gpt-5.3-codex"), input: 9, output: 99, reasoning: 99 };
    expect(await repo.getPricingForModel("github", "gpt-5.3-codex")).toEqual(expected);
    expect((await repo.getPricing()).github?.["gpt-5.3-codex"]).toEqual(expected);
    expect(store.write).not.toHaveBeenCalled();
  });
});
