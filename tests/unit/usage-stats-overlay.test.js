import { describe, it, expect, beforeEach } from "vitest";
import { saveRequestUsage, getUsageStats } from "../../src/lib/db/repos/usageRepo.js";
import { getAdapter } from "../../src/lib/db/driver.js";

describe("getUsageStats overlay aggregation", () => {
  beforeEach(async () => {
    const db = await getAdapter();
    db.run("DELETE FROM usageHistory");
    db.run("DELETE FROM usageDaily");
  });

  it("calculates lastUsed correctly via SQL MAX aggregation", async () => {
    const ts1 = "2026-08-25T10:00:00.000Z";
    const ts2 = "2026-08-25T12:00:00.000Z";

    await saveRequestUsage({
      timestamp: ts1,
      provider: "openai",
      model: "gpt-4o",
      connectionId: "conn-12345678",
      apiKey: "sk-test123456",
      endpoint: "/v1/chat/completions",
      tokens: { prompt_tokens: 100, completion_tokens: 50 },
      status: "ok"
    });

    await saveRequestUsage({
      timestamp: ts2,
      provider: "openai",
      model: "gpt-4o",
      connectionId: "conn-12345678",
      apiKey: "sk-test123456",
      endpoint: "/v1/chat/completions",
      tokens: { prompt_tokens: 200, completion_tokens: 80 },
      status: "ok"
    });

    const stats = await getUsageStats("all");
    expect(stats.byModel["gpt-4o (openai)"]).toBeDefined();
    expect(stats.byModel["gpt-4o (openai)"].lastUsed).toBe(ts2);
    const accountKey = "gpt-4o (openai - Account conn-123...)";
    expect(stats.byAccount[accountKey]).toBeDefined();
    expect(stats.byAccount[accountKey].lastUsed).toBe(ts2);
  });
});
