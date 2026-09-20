import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getProviderConnections: vi.fn(),
  getCombos: vi.fn(),
  getCustomModels: vi.fn(),
  getModelAliases: vi.fn(),
  getDisabledModels: vi.fn(),
}));

vi.mock("@/lib/localDb", () => ({
  getProviderConnections: mocks.getProviderConnections,
  getCombos: mocks.getCombos,
  getCustomModels: mocks.getCustomModels,
  getModelAliases: mocks.getModelAliases,
}));

vi.mock("@/lib/disabledModelsDb", () => ({
  getDisabledModels: mocks.getDisabledModels,
}));

const { buildModelsList } = await import("../../src/app/api/v1/models/route.js");

const MILLION_MEMBER = "ocg/deepseek-v4.1-flash";
const UNKNOWN_MEMBER = "ghost/does-not-exist";

async function comboEntry(name, models, kind = null) {
  mocks.getCombos.mockResolvedValue([{ id: `id-${name}`, name, kind, models }]);
  const list = await buildModelsList(kind ? [kind] : ["llm"]);
  return list.find((m) => m.id === name);
}

describe("combo entries expose token limits (#3486, #4096)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProviderConnections.mockResolvedValue([]);
    mocks.getCustomModels.mockResolvedValue([]);
    mocks.getModelAliases.mockResolvedValue({});
    mocks.getDisabledModels.mockResolvedValue({});
  });

  it("emits the effective context window of the combo", async () => {
    const combo = await comboEntry("all-million", [MILLION_MEMBER]);

    expect(combo).toBeTruthy();
    expect(combo.owned_by).toBe("combo");
    expect(combo.context_length).toBe(1_000_000);
  });

  it("uses the smallest member window, since the pool cannot exceed it", async () => {
    const combo = await comboEntry("mixed-window", [
      MILLION_MEMBER,
      UNKNOWN_MEMBER, // resolves to the 200k floor
    ]);

    expect(combo.context_length).toBe(200_000);
  });

  it("accepts member objects as well as plain string ids", async () => {
    const combo = await comboEntry("object-members", [
      { model: MILLION_MEMBER },
    ]);

    expect(combo.context_length).toBe(1_000_000);
  });

  it("keeps web combos free of llm token limits", async () => {
    const combo = await comboEntry("web-search-mix", [MILLION_MEMBER], "webSearch");

    expect(combo.kind).toBe("webSearch");
    expect(combo.context_length).toBeUndefined();
  });
});
