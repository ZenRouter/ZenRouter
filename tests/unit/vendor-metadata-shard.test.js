import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
const path = new URL("../../open-sse/providers/metadata/vendorModels.js", import.meta.url);
describe("vendor factual metadata shard", () => {
  it("provides dependency-free factual provider-scoped metadata", () => {
    expect(existsSync(path)).toBe(true);
    const text = readFileSync(path, "utf8");
    const metadata = JSON.parse(text.slice(text.indexOf("export default ") + 15).trim().replace(/;$/, ""));
    expect(metadata.deepseek["deepseek-v4-pro"].capabilities.vision).toBe(false);
    expect(metadata.glm["glm-5.3-flash"].capabilities.thinkingCanDisable).toBe(false);
    expect(metadata.kimi["kimi-for-coding-highspeed"].capabilities.contextWindow).toBe(262144);
    expect(metadata.cohere["command-a-03-2025"].capabilities.maxOutput).toBe(8000);
    expect(metadata["perplexity-agent"]["perplexity/sonar"].pricing).toMatchObject({ input: 0.25, output: 2.5, cached: 0.0625 });
    expect(metadata["alicode-intl"]["qwen3.7-plus"].pricing).toBeUndefined();
    expect(metadata["xiaomi-tokenplan"]["mimo-v2.6-pro"].pricing).toBeUndefined();
    for (const models of Object.values(metadata)) for (const entry of Object.values(models)) {
      expect(entry.sources.length).toBeGreaterThan(0);
      for (const value of Object.values(entry.capabilities || {})) expect(value).not.toBeNull();
      if (entry.pricing) expect(entry.billing.currency).toBe("USD");
    }
  });
});
