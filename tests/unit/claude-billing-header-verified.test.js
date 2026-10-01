import { describe, expect, it } from "vitest";
import { applyCloaking } from "../../open-sse/utils/claudeCloaking.js";
import { CLAUDE_STAINLESS } from "../../open-sse/config/clientVersions.js";

describe("Claude Code native billing header & stainless alignment", () => {
  it("generates literal cch=00000 and entrypoint=cli matching real Claude Code binary", () => {
    const body = applyCloaking({ messages: [] }, "sk-ant-oat-test", "ses-123");
    const header = body.system[0].text;
    expect(header).toMatch(/^x-anthropic-billing-header: cc_version=2\.1\.286\.[0-9a-f]{3}; cc_entrypoint=cli; cch=00000;$/);
  });

  it("updates Stainless package version to bundled SDK 0.127.0", () => {
    expect(CLAUDE_STAINLESS.packageVersion).toBe("0.127.0");
  });
});
