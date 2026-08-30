import { describe, it, expect } from "vitest";
import { ERROR_RULES } from "../../open-sse/config/errorConfig.js";

describe("CommandCode Stream Error Rule (#3636)", () => {
  it("includes rules for CommandCode error patterns", () => {
    const cmdCodeRules = ERROR_RULES.filter(r => r.text && r.text.includes("commandcode"));
    expect(cmdCodeRules.length).toBeGreaterThanOrEqual(1);
    expect(cmdCodeRules.some(r => r.text === "[commandcode error" || r.text === "commandcode error")).toBe(true);
  });
});
