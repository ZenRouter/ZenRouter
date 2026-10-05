import { describe, it, expect } from "vitest";
import go from "../../open-sse/providers/registry/opencode-go.js";
import clinepass from "../../open-sse/providers/registry/clinepass.js";

describe("official gateway lifecycle and subscription notices", () => {
  for (const id of ["cline-pass/glm-5.2", "cline-pass/kimi-k2.6", "cline-pass/kimi-k2.7-code", "cline-pass/deepseek-v4-flash"]) {
    it(`retains retired ${id} for saved selections, visibly deprecated`, () => {
      const row = clinepass.models.find(m => m.id === id);
      expect(row).toBeDefined();
      expect(row.deprecated).toBe(true);
      expect(row.deprecationNotice).toContain("no longer available on ClinePass");
      expect(row).not.toHaveProperty("upstreamModelId");
    });
  }
  it("states Go and Go Plus monthly prices, not quota-reference token tariffs", () => {
    expect(go.display.notice.text).toContain("Go: $10/month");
    expect(go.display.notice.text).toContain("Go Plus: $40/month");
    expect(go.display.notice.text).not.toContain("$5/mo");
  });
});
