import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ values: [], cursor: 0 }));
vi.mock("react", () => ({
  useState: initial => { const index = state.cursor++; if (!(index in state.values)) state.values[index] = typeof initial === "function" ? initial() : initial; return [state.values[index], value => { state.values[index] = value; }]; },
  useEffect: fn => fn(),
  useCallback: fn => fn,
}));
beforeEach(() => {
  vi.resetModules();
  state.values = []; state.cursor = 0;
  vi.stubGlobal("window", { addEventListener: vi.fn(), removeEventListener: vi.fn() });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ models: [
    { provider: "cx", model: "gpt-5.6-sol", fullModel: "cx/gpt-5.6-sol", caps: { contextWindow: 333333, vision: false } },
    { provider: "openai", model: "gpt-5.6-sol", fullModel: "openai/gpt-5.6-sol", caps: { contextWindow: 999999, vision: true } },
  ] }) }));
});
it("resolves qualified aliases within the provider instead of another provider's bare ID", async () => {
  const { useModelCaps } = await import("@/shared/hooks/useModelCaps.js");
  useModelCaps();
  await vi.waitFor(() => expect(state.values[0]["cx/gpt-5.6-sol"]).toBeDefined());
  state.cursor = 0;
  const { getCaps } = useModelCaps();
  expect(getCaps("codex/gpt-5.6-sol")).toMatchObject({ contextWindow: 333333, vision: false });
  expect(getCaps("openai/gpt-5.6-sol").contextWindow).toBe(999999);
  expect(getCaps("unknown-fixture/gpt-5.6-sol").contextWindow).not.toBe(999999);
});
