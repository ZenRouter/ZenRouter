import { beforeEach, describe, expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({ rows: [] }));
vi.mock("../../src/lib/db/repos/aliasRepo.js", () => ({ getCustomModels: async () => fixture.rows }));
import { getDeclaredModelCaps, invalidateDeclaredModelCaps } from "../../open-sse/providers/declaredCaps.js";
beforeEach(() => { fixture.rows = []; invalidateDeclaredModelCaps(); });

describe("runtime operator capabilities use provider and literal model identity", () => {
  it("keeps same model IDs isolated between providers and accepts equivalent provider tokens", async () => {
    fixture.rows = [
      { providerAlias: "ag", id: "shared", caps: { vision: false, maxOutput: 12000 } },
      { providerAlias: "cx", id: "shared", caps: { vision: true, maxOutput: 24000 } },
    ];
    expect(await getDeclaredModelCaps("antigravity", "shared")).toEqual({ vision: false, maxOutput: 12000 });
    expect(await getDeclaredModelCaps("codex", "shared")).toEqual({ vision: true, maxOutput: 24000 });
    expect(await getDeclaredModelCaps("another", "shared")).toBeUndefined();
  });
  it("preserves native namespace before accepting a genuinely decorated route", async () => {
    fixture.rows = [{ providerAlias: "nvidia", id: "nvidia/shared", caps: { vision: true } }];
    expect(await getDeclaredModelCaps("nvidia", "nvidia/shared")).toEqual({ vision: true });
    expect(await getDeclaredModelCaps("nvidia", "nvidia/nvidia/shared")).toEqual({ vision: true });
    expect(await getDeclaredModelCaps("nvidia", "other/shared")).toBeUndefined();
  });
  it("does not let STT declarations replace the chat capability profile", async () => {
    fixture.rows = [
      { providerAlias: "gemini", id: "shared", type: "llm", caps: { vision: true } },
      { providerAlias: "gemini", id: "shared", type: "stt", caps: { audioInput: true } },
    ];
    expect(await getDeclaredModelCaps("gemini", "shared")).toEqual({ vision: true });
  });
  it("retains explicit false and refreshes after invalidation", async () => {
    fixture.rows = [{ providerAlias: "openai", id: "custom", caps: { vision: false } }];
    expect(await getDeclaredModelCaps("openai", "custom")).toEqual({ vision: false });
    fixture.rows = []; invalidateDeclaredModelCaps();
    expect(await getDeclaredModelCaps("openai", "custom")).toBeUndefined();
  });
});
