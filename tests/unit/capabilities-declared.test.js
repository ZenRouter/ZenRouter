import { describe, it, expect } from "vitest";
import { withDeclaredCapabilities, DEFAULT_CAPABILITIES } from "../../open-sse/providers/capabilities.js";

describe("withDeclaredCapabilities overlay", () => {
  it("returns base unchanged when declared is missing or empty", () => {
    const base = { vision: false, reasoning: false, contextWindow: 128000 };
    expect(withDeclaredCapabilities(base, null)).toBe(base);
    expect(withDeclaredCapabilities(base, undefined)).toBe(base);
    expect(withDeclaredCapabilities(base, {})).toBe(base);
  });

  it("overlays declared capabilities onto the base", () => {
    const base = { vision: false, reasoning: false, contextWindow: 128000, maxOutput: 8192 };
    const declared = { vision: true, reasoning: true };

    const merged = withDeclaredCapabilities(base, declared);
    expect(merged.vision).toBe(true);
    expect(merged.reasoning).toBe(true);
    expect(merged.contextWindow).toBe(128000);
    expect(merged.maxOutput).toBe(8192);
  });

  it("rejects unknown capability keys and prevents prototype pollution", () => {
    const base = { vision: false };
    const declared = {
      vision: true,
      dangerousField: "should_be_ignored",
      __proto__: { polluted: true },
    };

    const merged = withDeclaredCapabilities(base, declared);
    expect(merged.vision).toBe(true);
    expect(merged.dangerousField).toBeUndefined();
    expect({}.polluted).toBeUndefined();
  });
});
