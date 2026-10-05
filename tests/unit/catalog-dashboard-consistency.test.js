import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getModelAliases: vi.fn(), setModelAlias: vi.fn(), getCustomModels: vi.fn(), getDisabledModels: vi.fn() }));
vi.mock("@/models", () => mocks);
vi.mock("@/lib/disabledModelsDb", () => mocks);
const { GET, PUT } = await import("@/app/api/models/route.js");

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getModelAliases.mockResolvedValue({});
  mocks.getCustomModels.mockResolvedValue([]);
  mocks.getDisabledModels.mockResolvedValue({});
});

describe("dashboard catalog declarations", () => {
  it("exposes scoped evidence and does not revive unsupported registry output caps", async () => {
    const { models } = await (await GET()).json();
    const sol = models.find(m => m.fullModel === "cx/gpt-6.1-sol");
    expect(sol.metadata.limits).toMatchObject({ cliMaxContext: 872000, apiContextWindow: 1050000 });
    expect(sol.metadata.billing.kind).toBe("api-reference");
    const grok = models.find(m => m.model === "grok-build" && m.provider === "gcli");
    expect(grok.caps.maxOutput).toBeNull();
  });
  it.each(["cx", "codex"])("overlays existing built-ins under %s without duplicates", async providerAlias => {
    mocks.getCustomModels.mockResolvedValue([{ providerAlias, id: "gpt-6.1-sol", caps: { vision: false, contextWindow: 333333, maxInput: 222222 } }]);
    const { models } = await (await GET()).json();
    const rows = models.filter(m => ["cx", "codex"].includes(m.provider) && m.model === "gpt-6.1-sol");
    expect(rows).toHaveLength(1);
    expect(rows[0].caps).toMatchObject({ vision: false, contextWindow: 333333, maxInput: 222222 });
  });
  it("keeps disabled custom overrides hidden", async () => {
    mocks.getDisabledModels.mockResolvedValue({ cx: ["gpt-6.1-sol"] });
    mocks.getCustomModels.mockResolvedValue([{ providerAlias: "codex", id: "gpt-6.1-sol", caps: { vision: false } }]);
    expect((await (await GET()).json()).models.some(m => m.model === "gpt-6.1-sol" && ["cx", "codex"].includes(m.provider))).toBe(false);
  });
  it("reads aliases stored alias -> provider/model", async () => {
    mocks.getModelAliases.mockResolvedValue({ mine: "cx/gpt-6.1-sol" });
    expect((await (await GET()).json()).models.find(m => m.fullModel === "cx/gpt-6.1-sol").alias).toBe("mine");
  });
  it("writes aliases in runtime direction", async () => {
    expect((await PUT({ json: async () => ({ model: "cx/gpt-6.1-sol", alias: "mine" }) })).status).toBe(200);
    expect(mocks.setModelAlias).toHaveBeenCalledWith("mine", "cx/gpt-6.1-sol");
  });
  it("rejects an alias owned by another model", async () => {
    mocks.getModelAliases.mockResolvedValue({ mine: "openai/gpt-4.1" });
    expect((await PUT({ json: async () => ({ model: "cx/gpt-6.1-sol", alias: "mine" }) })).status).toBe(400);
    expect(mocks.setModelAlias).not.toHaveBeenCalled();
  });
});
