import { describe, expect, it } from "vitest";
import { PONYTAIL_LEVELS, PONYTAIL_PROMPTS } from "../../open-sse/rtk/ponytailPrompt.js";

describe("Ponytail prompts v4.10.0 synchronization", () => {
  it("defines all levels", () => {
    expect(PONYTAIL_LEVELS.LITE).toBe("lite");
    expect(PONYTAIL_LEVELS.FULL).toBe("full");
    expect(PONYTAIL_LEVELS.ULTRA).toBe("ultra");
  });

  it("includes the 7-rung ladder with codebase reuse", () => {
    for (const level of Object.values(PONYTAIL_LEVELS)) {
      const prompt = PONYTAIL_PROMPTS[level];
      expect(prompt).toContain("Already in this codebase?");
      expect(prompt).toContain("YAGNI");
      expect(prompt).toContain("Bug fix = root cause, not symptom");
      expect(prompt).toContain("Never lazy about understanding");
    }
  });

  it("has distinct directives per level", () => {
    expect(PONYTAIL_PROMPTS.lite).toContain("Lite: build what's asked, but name the lazier alternative");
    expect(PONYTAIL_PROMPTS.full).toContain("Full: the ladder enforced");
    expect(PONYTAIL_PROMPTS.ultra).toContain("Ultra: YAGNI extremist");
  });
});
