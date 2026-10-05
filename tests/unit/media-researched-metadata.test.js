import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PROVIDER_MODELS } from "../../open-sse/providers/index.js";

const path = new URL("../../open-sse/providers/metadata/mediaModels.js", import.meta.url);
const expected = {
  openai: ["gpt-image-2.5-flare", "gpt-image-2.5-sunburst"],
  gemini: ["gemini-embedding-2", "gemini-3.1-flash-lite-image", "gemini-3.8-flash-tts", "gemini-3.8-flash-lite-tts"],
  "voyage-ai": ["voyage-code-4"], mistral: ["codestral-embed-2505"],
  fireworks: ["fireworks/qwen3-embedding-8b"],
  "jina-ai": ["jina-embeddings-v5-text-small", "jina-embeddings-v5-text-nano"],
  elevenlabs: ["eleven_v4", "eleven_v4_turbo"], inworld: ["inworld-tts-2", "inworld-tts-2-flash"],
  recraft: ["recraftv4_1_flash", "recraftv4_1", "recraftv4_1_vector", "recraftv4_1_pro", "recraftv4_1_pro_vector"],
};
async function metadata() {
  expect(existsSync(path), "reviewed media metadata shard exists").toBe(true);
  return (await import("../../open-sse/providers/metadata/mediaModels.js")).default;
}
describe("reviewed media metadata preserves billing units and uncertainty", () => {
  it("every added literal ID has sources, route limitations and no invented token window", async () => {
    const shard = await metadata();
    for (const [provider, ids] of Object.entries(expected)) {
      expect(Object.keys(shard[provider]).sort()).toEqual([...ids].sort());
      for (const id of ids) {
        const row = shard[provider][id];
        expect(row.sources.length).toBeGreaterThan(0);
        expect(row.sources.every(url => url.startsWith("https://"))).toBe(true);
        expect(row.limits.authenticatedRouteVerified).toBe(false);
        expect(row.limits.routeLimitations.length).toBeGreaterThan(0);
        expect(row.capabilities.contextWindow).toBeUndefined();
        expect(row.capabilities.tools).toBe(false);
        expect(row.capabilities.vision).toBe(false);
        expect(row.billing.note.length).toBeGreaterThan(0);
        const alias = { "jina-ai": "jina", elevenlabs: "el" }[provider] || provider;
        expect(PROVIDER_MODELS[alias].some(m => m.id === id && m.kind === row.limits.kind)).toBe(true);
      }
    }
  });
  it("keeps input-only token prices separate from image, character and multimodal meters", async () => {
    const shard = await metadata();
    for (const [provider, id, input] of [["gemini", "gemini-embedding-2", 0.2], ["voyage-ai", "voyage-code-4", 0.12], ["mistral", "codestral-embed-2505", 0.15], ["fireworks", "fireworks/qwen3-embedding-8b", 0.1]]) {
      expect(shard[provider][id].pricing).toEqual({ input });
    }
    for (const [id, rate] of [["recraftv4_1_flash", 0.007], ["recraftv4_1", 0.035], ["recraftv4_1_vector", 0.08], ["recraftv4_1_pro", 0.21], ["recraftv4_1_pro_vector", 0.3]]) {
      expect(shard.recraft[id].pricing).toEqual({});
      expect(shard.recraft[id].billing).toMatchObject({ currency: "USD", unit: "image", rates: { rate } });
    }
    expect(shard.inworld["inworld-tts-2"].billing).toMatchObject({ unit: "million_characters", rates: { rate: 25 } });
    expect(shard.inworld["inworld-tts-2-flash"].billing.rates.rate).toBe(15);
    for (const provider of ["openai", "elevenlabs", "inworld", "jina-ai"]) {
      for (const row of Object.values(shard[provider])) expect(row.pricing).toEqual({});
    }
    expect(shard.gemini["gemini-3.8-flash-tts"].billing.rates.valid_through).toBe("2026-12-31");
    expect(shard.gemini["gemini-3.8-flash-lite-tts"].pricing).toEqual({});
  });
  it("distinguishes dimensions, characters, rounded labels and exact input/output limits", async () => {
    const shard = await metadata();
    expect(shard.gemini["gemini-embedding-2"].limits).toMatchObject({ maxInput: 8192, dimensions: { min: 128, max: 3072 } });
    expect(shard.gemini["gemini-embedding-2"].capabilities.maxOutput).toBeUndefined();
    expect(shard["voyage-ai"]["voyage-code-4"].limits).toMatchObject({ maxInput: 32000, dimensions: { default: 1024 } });
    expect(shard["jina-ai"]["jina-embeddings-v5-text-small"].limits).toMatchObject({ maxInput: 32768, dimensions: 1024 });
    expect(shard["jina-ai"]["jina-embeddings-v5-text-nano"].limits).toMatchObject({ maxInput: 8192, dimensions: 768 });
    expect(shard.mistral["codestral-embed-2505"].limits.providerContextLabel).toBe("8k");
    expect(shard.mistral["codestral-embed-2505"].capabilities.maxInput).toBeUndefined();
    expect(shard.fireworks["fireworks/qwen3-embedding-8b"].limits.providerContextLabel).toBe("40k");
    expect(shard.elevenlabs.eleven_v4.limits.characters).toBe(10000);
    expect(shard.elevenlabs.eleven_v4_turbo.limits.characters).toBeUndefined();
    expect(shard.inworld["inworld-tts-2"].limits).toMatchObject({ utf16CodeUnits: 2000 });
    expect(shard.gemini["gemini-3.1-flash-lite-image"].capabilities).toMatchObject({ maxInput: 65536, maxOutput: 4096, imageOutput: true });
    expect(shard.gemini["gemini-3.8-flash-tts"].capabilities).toMatchObject({ maxInput: 8192, maxOutput: 16384, audioOutput: true });
  });
});
