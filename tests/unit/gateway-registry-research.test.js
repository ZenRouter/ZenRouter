import { describe, it, expect } from "vitest";
import opencode from "../../open-sse/providers/registry/opencode.js";
import go from "../../open-sse/providers/registry/opencode-go.js";
import clinepass from "../../open-sse/providers/registry/clinepass.js";
import morph from "../../open-sse/providers/registry/morph.js";
import fireworks from "../../open-sse/providers/registry/fireworks.js";
import { DefaultExecutor } from "../../open-sse/executors/default.js";
import { OpenCodeExecutor } from "../../open-sse/executors/opencode.js";
import { getModelTargetFormat, getModelSupportedFormats } from "../../open-sse/config/providerModels.js";
import { resolveTransport } from "../../open-sse/services/provider.js";

const additions = [
  [opencode, ["fledge-alpha-free", "ling-3.1-flash-free", "longcat-2.5-preview-free", "space-bunny-free", "mimo-v2.6-flash-free"], "https://opencode.ai/zen/v1/chat/completions"],
  [go, ["mimo-v2.6-pro", "mimo-v2.6-flash", "longcat-2.5-preview-free", "space-bunny-free", "kimi-k3", "deepseek-v4.1-flash"], "https://opencode.ai/zen/go/v1/chat/completions"],
  [clinepass, ["cline-pass/glm-5.3", "cline-pass/glm-5.3-flash", "cline-pass/kimi-k3", "cline-pass/deepseek-v4.1-flash", "cline-pass/qwen3.8-max", "cline-pass/muse-spark-1.3-contributor"], "https://api.cline.bot/api/v1/chat/completions"],
  [morph, ["morph-kimik3", "morph-glm53-744b", "morph-glm53flash", "morph-dsv41flash"], "https://api.morphllm.com/v1/chat/completions"],
];

describe("primary-source gateway additions (offline)", () => {
  for (const [provider, ids, url] of additions) {
    for (const id of ids) {
      it(`${provider.id}/${id} keeps its literal ID and supported chat endpoint`, () => {
        const row = provider.models.find(m => m.id === id);
        expect(row, "documented registry row").toBeDefined();
        expect(row.targetFormat).toBe("openai");
        expect(row.supportedFormats).toEqual(["openai"]);
        expect(row).not.toHaveProperty("contextLength");
        for (const source of ["openai", "claude", "openai-responses"]) {
          const formats = getModelSupportedFormats(provider.alias, id);
          const rt = formats.includes(source) ? resolveTransport(provider.id, source) : null;
          expect(rt?.format || getModelTargetFormat(provider.alias, id)).toBe("openai");
          const executor = provider.id === "opencode" ? new OpenCodeExecutor() : new DefaultExecutor(provider.id);
          expect(executor.buildUrl(id, false, 0, { runtimeTransport: rt })).toBe(url);
        }
      });
    }
  }
  it("preserves established provider defaults while adding suggestions", () => {
    expect(opencode.models[0].id).toBe("muse-spark-1.2-contributor-free");
    expect(go.models[0].id).toBe("glm-5.3-flash");
    expect(morph.models[0].id).toBe("morph-v3-large");
  });
  it("does not curate unsupported Jev or expiring Ember preview", () => {
    expect(opencode.models.some(m => m.id === "jev-1.13-free")).toBe(false);
    expect(fireworks.models.some(m => m.id === "accounts/fireworks/models/ember-1")).toBe(false);
  });
});
