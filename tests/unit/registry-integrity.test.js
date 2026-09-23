import { describe, it, expect } from "vitest";
import { PROVIDER_MODELS } from "../../open-sse/config/providerModels.js";

// Structural integrity for the whole provider catalog: catches duplicate
// keys (e.g. a doubled `models:` block silently dropping entries), missing
// ids/names, and duplicate model ids inside one provider.
describe("provider registry integrity", () => {
  // PROVIDER_MODELS is the routable catalog (PROVIDERS is transport-only).
  const entries = Object.entries(PROVIDER_MODELS);

  it("registers a non-trivial provider catalog", () => {
    expect(entries.length).toBeGreaterThan(50);
  });

  it("every model has id + name", () => {
    for (const [key, models] of entries) {
      for (const m of models || []) {
        expect(typeof m.id, `${key} model id`).toBe("string");
        expect(m.id.length, `${key} model id`).toBeGreaterThan(0);
        expect(m.name || m.id, `${key}/${m.id} name`).toBeTruthy();
      }
    }
  });

  it("no same-kind duplicate model ids inside a single provider", () => {
    // Cross-kind duplicates are intentional (e.g. gemini lists gemini-2.5-pro
    // once for chat and once for STT with kind-specific params); findModel
    // resolves the first (chat) match, STT uses kind-filtered lookups.
    const kindOf = (m) => m.kind || "llm";
    for (const [key, models] of entries) {
      const seen = new Set();
      for (const m of models || []) {
        const slot = `${m.id}::${kindOf(m)}`;
        expect(seen.has(slot), `${key} duplicate model ${m.id} (kind ${kindOf(m)})`).toBe(false);
        seen.add(slot);
      }
    }
  });

  it("current flagships are present where verified", () => {
    const has = (provider, id) => (PROVIDER_MODELS[provider] || []).some((m) => m.id === id);
    expect(has("openai", "gpt-5.5")).toBe(true);
    expect(has("openai", "gpt-6-astra")).toBe(true);
    expect(has("gemini", "gemini-3.5-flash")).toBe(true);
    expect(has("xai", "grok-4.7")).toBe(true);
    expect(has("kimi", "kimi-k3")).toBe(true);
    expect(has("cohere", "command-a-reasoning-08-2025")).toBe(true);
    expect(has("voyage-ai", "voyage-4")).toBe(true);
  });

  it("retired IDs are gone from routable lists", () => {
    const has = (provider, id) => (PROVIDER_MODELS[provider] || []).some((m) => m.id === id);
    expect(has("openai", "dall-e-2")).toBe(false);
    expect(has("gemini", "gemini-3-pro-preview")).toBe(false);
    expect(has("deepseek", "deepseek-chat")).toBe(false);
    expect(has("xai", "grok-3")).toBe(false);
    expect(has("kimi", "kimi-k2.5")).toBe(false);
    expect(has("xiaomi-mimo", "mimo-v2-omni")).toBe(false);
  });
});
