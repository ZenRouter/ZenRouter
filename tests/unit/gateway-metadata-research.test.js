import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
const path = new URL("../../open-sse/providers/metadata/gatewayModels.js", import.meta.url);

describe("gateway primary-source metadata shard", () => {
  it("keeps exact hosted facts and non-token subscription billing separate", () => {
    expect(existsSync(path), "new gateway factual shard").toBe(true);
    const text = readFileSync(path, "utf8");
    const data = JSON.parse(text.slice(text.indexOf("export default ") + 15).trim().replace(/;$/, ""));
    expect(Object.keys(data.opencode)).toHaveLength(5);
    for (const entry of Object.values(data.opencode)) {
      expect(entry.pricing).toEqual({ input: 0, output: 0, cached: 0 });
      expect(entry.capabilities).toBeUndefined();
      expect(entry.billing.kind).toBe("free-promotion");
    }
    for (const provider of ["opencode-go", "clinepass"]) {
      expect(Object.keys(data[provider]).length).toBeGreaterThan(0);
      for (const entry of Object.values(data[provider])) {
        expect(entry.pricing).toBeUndefined();
        expect(entry.capabilities).toBeUndefined();
        expect(entry.billing.unit).toBe("month");
        expect(entry.billing.note).toContain("quota");
      }
    }
    expect(data.morph["morph-kimik3"].pricing).toEqual({ input: 2.5, output: 14, cached: 0.29 });
    expect(data.morph["morph-glm53-744b"].pricing).toEqual({ input: 1.19, output: 3.74, cached: 0.1955 });
    expect(data.morph["morph-glm53flash"].pricing).toEqual({ input: 0.2, output: 0.7, cached: 0.04 });
    expect(data.morph["morph-dsv41flash"].pricing).toEqual({ input: 0.15, output: 0.6 });
    expect(data.morph["morph-dsv4flash"].pricing).toEqual({ input: 0.141953125, output: 0.399625, cached: 0.0359375 });
    expect(data.morph["morph-dsv41flash"].capabilities).toMatchObject({ vision: true, videoInput: false, tools: true, reasoning: true, structuredOutput: true });
    for (const entry of Object.values(data.morph)) {
      expect(entry.capabilities).not.toHaveProperty("contextWindow");
      expect(entry.capabilities).not.toHaveProperty("maxOutput");
      expect(entry.limits).toEqual({ contextWindowText: "1M", scope: "Morph shared inference; exact token count and maximum output unverified", unverifiedCapabilityFields: ["contextWindow", "maxOutput"] });
    }
    expect(data.fireworks).toBeUndefined();
    for (const models of Object.values(data)) for (const entry of Object.values(models)) {
      expect(entry.sources.length).toBeGreaterThan(0);
      for (const url of entry.sources) expect(url).toMatch(/^https:\/\//);
      if (entry.pricing) expect(entry.billing).toMatchObject({ currency: "USD", unit: "per_1000000_tokens" });
    }
  });
});
