import { describe, expect, it } from "vitest";
import { OpenCodeExecutor } from "../../open-sse/executors/opencode.js";

const FREE_13 = "muse-spark-1.3-contributor-free";
const CREDS = { connectionId: "opencode-reasoning-clamp-test" };

describe("OpenCode muse-spark reasoning clamp (#4149)", () => {
  it("clamps xhigh effort to high for muse-spark", () => {
    const body = {
      model: FREE_13,
      reasoning_effort: "xhigh",
      input: [{ type: "message", role: "user", content: "hello" }],
    };
    const out = new OpenCodeExecutor().transformRequest(FREE_13, body, true, CREDS);
    expect(out.reasoning.effort).toBe("high");
    expect(out.reasoning_effort).toBeUndefined();
  });

  it("clamps max effort to high for muse-spark", () => {
    const body = {
      model: FREE_13,
      reasoning_effort: "max",
      input: [{ type: "message", role: "user", content: "hello" }],
    };
    const out = new OpenCodeExecutor().transformRequest(FREE_13, body, true, CREDS);
    expect(out.reasoning.effort).toBe("high");
  });

  it("preserves supported minimal, low, medium, and high efforts", () => {
    for (const level of ["minimal", "low", "medium", "high"]) {
      const body = {
        model: FREE_13,
        reasoning_effort: level,
        input: [{ type: "message", role: "user", content: "hello" }],
      };
      const out = new OpenCodeExecutor().transformRequest(FREE_13, body, true, CREDS);
      expect(out.reasoning.effort).toBe(level);
    }
  });
});
