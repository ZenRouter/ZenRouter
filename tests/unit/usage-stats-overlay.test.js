import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

let dataDir;
let previousDataDir;
let previousListeners;
const shutdownEvents = ["beforeExit", "SIGINT", "SIGTERM"];
let saveRequestUsage;
let getUsageStats;

beforeEach(async () => {
  previousDataDir = process.env.DATA_DIR;
  previousListeners = new Map(
    shutdownEvents.map((event) => [event, process.rawListeners(event)])
  );
  dataDir = await mkdtemp(join(tmpdir(), "zenrouter-usage-overlay-"));
  process.env.DATA_DIR = dataDir;
  vi.resetModules();
  delete global._dbAdapter;
  ({ saveRequestUsage, getUsageStats } = await import("../../src/lib/db/repos/usageRepo.js"));
});

afterEach(async () => {
  try {
    await global._dbAdapter?.instance?.close();
  } finally {
    for (const event of shutdownEvents) {
      const existing = [...previousListeners.get(event)];
      for (const listener of process.rawListeners(event)) {
        const index = existing.indexOf(listener);
        if (index === -1) process.removeListener(event, listener);
        else existing.splice(index, 1);
      }
    }
    delete global._dbAdapter;
    vi.resetModules();
    if (previousDataDir === undefined) delete process.env.DATA_DIR;
    else process.env.DATA_DIR = previousDataDir;
    if (dataDir) await rm(dataDir, { recursive: true, force: true });
    dataDir = undefined;
  }
});

describe("getUsageStats overlay aggregation", () => {

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
