import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getProviderConnections: vi.fn(), getCombos: vi.fn(), getCustomModels: vi.fn(),
  getModelAliases: vi.fn(), getDisabledModels: vi.fn(),
}));
vi.mock("@/lib/localDb", () => mocks);
vi.mock("@/lib/disabledModelsDb", () => ({ getDisabledModels: mocks.getDisabledModels }));
const { buildModelsList } = await import("@/app/api/v1/models/route.js");

beforeEach(() => {
  mocks.getProviderConnections.mockResolvedValue([]);
  mocks.getCombos.mockResolvedValue([]);
  mocks.getCustomModels.mockResolvedValue([]);
  mocks.getModelAliases.mockResolvedValue({});
  mocks.getDisabledModels.mockResolvedValue({});
});

describe("media model lists", () => {
  it("includes Grok generators in image lists and excludes them from chat lists", async () => {
    const images = (await buildModelsList(["image"])).map((m) => m.id);
    const chats = (await buildModelsList(["llm"])).map((m) => m.id);
    expect(images).toContain("xai/grok-imagine-image-2.0");
    expect(images).toContain("openrouter/openai/gpt-image-1");
    expect(chats).not.toContain("xai/grok-imagine-image-2.0");
    expect(chats).not.toContain("xai/grok-imagine-video");
    expect(chats).toContain("xai/grok-4.7");
  });

  it("keeps correct categories for connected accounts with an explicit model whitelist", async () => {
    mocks.getProviderConnections.mockResolvedValue([{ provider: "xai", isActive: true, providerSpecificData: { enabledModels: ["grok-imagine-image-2.0", "grok-imagine-video", "grok-4.7"] } }]);
    // Unrelated no-auth providers remain discoverable; the whitelist scopes
    // this account, not the complete public catalog.
    const ownIds = async (kind) => (await buildModelsList([kind]))
      .filter((m) => m.owned_by === "xai").map((m) => m.id);
    expect(await ownIds("image")).toEqual(["xai/grok-imagine-image-2.0"]);
    expect(await ownIds("llm")).toEqual(["xai/grok-4.7"]);
    expect(await ownIds("video")).toEqual(["xai/grok-imagine-video"]);
  });

  it("corrects incorrectly saved custom generator rows without modifying storage", async () => {
    mocks.getCustomModels.mockResolvedValue([{ providerAlias: "xai", id: "grok-imagine-image", type: "llm" }]);
    expect((await buildModelsList(["llm"])).some((m) => m.id === "xai/grok-imagine-image")).toBe(false);
    expect((await buildModelsList(["image"])).some((m) => m.id === "xai/grok-imagine-image")).toBe(true);
    mocks.getProviderConnections.mockResolvedValue([{ provider: "xai", isActive: true }]);
    expect((await buildModelsList(["llm"])).some((m) => m.id === "xai/grok-imagine-image")).toBe(false);
  });
});
