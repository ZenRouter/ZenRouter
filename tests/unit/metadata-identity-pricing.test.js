import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import REGISTRY from "../../open-sse/providers/registry/index.js";
import { getCapabilitiesForModel, PROVIDER_CAPABILITIES } from "../../open-sse/providers/capabilities.js";
import { getPricingForModel } from "../../open-sse/providers/pricing.js";

const tokens = (p) => [...new Set([p.id, p.alias, p.uiAlias, ...(p.aliases || [])].filter(Boolean))];
const identityPath = new URL("../../open-sse/providers/identity.js", import.meta.url);

describe("registry-wide metadata identity contract", () => {
  it("resolves every accepted provider token to identical capabilities and pricing", () => {
    const mismatches = [];
    for (const provider of REGISTRY) for (const model of provider.models || []) {
      for (const token of tokens(provider)) {
        for (const [kind, resolve] of [["caps", getCapabilitiesForModel], ["price", getPricingForModel]]) {
          if (JSON.stringify(resolve(token, model.id)) !== JSON.stringify(resolve(provider.id, model.id))) {
            mismatches.push([kind, provider.id, token, model.id]);
          }
        }
      }
    }
    expect(mismatches).toEqual([]);
    expect(PROVIDER_CAPABILITIES.cx).toBe(PROVIDER_CAPABILITIES.codex);
  });

  it("ships dependency-free, deterministic generated identities and declared upstream mappings", async () => {
    expect(existsSync(identityPath)).toBe(true);
    const identity = await import(identityPath.href);
    for (const provider of REGISTRY) {
      // A declared canonical ID wins over a colliding alias (legacy mmf/mimo-free).
      for (const token of tokens(provider)) {
        expect(identity.canonicalizeProviderId(token)).toBe(REGISTRY.some(p => p.id === token) ? token : provider.id);
      }
      expect(identity.PROVIDER_STORAGE_ALIASES[provider.id]).toBe(provider.alias || provider.id);
      for (const model of provider.models || []) {
        expect(identity.getDeclaredUpstreamModelId(provider.id, model.id)).toBe(model.upstreamModelId || model.id);
      }
    }
    for (const custom of ["My-Custom", "moonshot", "moonshotai", "constructor", "__proto__", null]) {
      expect(identity.canonicalizeProviderId(custom)).toBe(custom);
    }
    expect(identity.canonicalizeProviderId("kmc")).toBe("kimi");
    const source = readFileSync(identityPath, "utf8");
    expect(source).not.toMatch(/\bimport\s*(?:[({*]|[\w]+\s+from)/);
    const generator = new URL("../../scripts/generate-provider-identity.mjs", import.meta.url);
    execFileSync(process.execPath, [generator.pathname, "--check"]);
    execFileSync(process.execPath, [generator.pathname, "--check"]);
    expect(readFileSync(identityPath, "utf8")).toBe(source);
  });
});
