import { describe, it, expect } from "vitest";
import clineRegistry from "../../open-sse/providers/registry/cline.js";
import { getCapabilitiesForModel } from "../../open-sse/providers/capabilities.js";

// 9Router #3946: Cline's Free catalog lists Muse Spark 1.3 Contributor
// (cline-free/muse-spark-1.3-contributor) but the cline provider did not
// expose it, so it could not be selected or connection-tested.
describe("Cline Free Muse Spark 1.3 Contributor (#3946)", () => {
  const MODEL = "cline-free/muse-spark-1.3-contributor";

  it("is listed in the cline registry catalog", () => {
    const ids = (clineRegistry?.models || []).map((m) => m.id);
    expect(ids).toContain(MODEL);
  });

  it("resolves full vision+reasoning capabilities (not the DEFAULT floor)", () => {
    const caps = getCapabilitiesForModel("cline", MODEL);
    expect(caps.vision).toBe(true);
    expect(caps.reasoning).toBe(true);
    expect(caps.thinkingFormat).toBe("openai");
    expect(caps.contextWindow).toBe(1048576);
    expect(caps.maxOutput).toBe(131072);
  });

  it("matches the OpenCode free variant's capability profile", () => {
    const clineCaps = getCapabilitiesForModel("cline", MODEL);
    const ocCaps = getCapabilitiesForModel("opencode", "muse-spark-1.3-contributor-free");
    expect(clineCaps.vision).toBe(ocCaps.vision);
    expect(clineCaps.reasoning).toBe(ocCaps.reasoning);
    expect(clineCaps.contextWindow).toBe(ocCaps.contextWindow);
  });
});
