import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  getProviderConnections: vi.fn(),
  updateProviderConnection: vi.fn(),
}));
vi.mock("@/lib/localDb", () => db);
vi.mock("@/lib/network/connectionProxy", () => ({
  pickProxyPoolId: vi.fn(),
  resolveConnectionProxyConfig: vi.fn(),
}));
vi.mock("@/sse/utils/logger.js", () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn() }));

const { markAccountUnavailable } = await import("../../src/sse/services/auth.js");
const message = "Caller does not have required permission to use project aicode-consumers. Grant serviceusage.services.use permission.";

beforeEach(() => {
  vi.clearAllMocks();
  db.getProviderConnections.mockResolvedValue([{ id: "account-a", backoffLevel: 0 }]);
  db.updateProviderConnection.mockResolvedValue(true);
});

describe("Antigravity quota-project IAM failure", () => {
  it.each([
    ["antigravity", 403, message],
    ["ag", "403", { error: { message } }],
    ["antigravity", 403, new Error("Missing SERVICEUSAGE.SERVICES.USE permission")],
  ])("does not rotate or write account locks (%s)", async (provider, status, error) => {
    expect(await markAccountUnavailable("account-a", status, error, provider, "gemini-3.8-flash-high"))
      .toEqual({ shouldFallback: false, cooldownMs: 0 });
    expect(db.getProviderConnections).not.toHaveBeenCalled();
    expect(db.updateProviderConnection).not.toHaveBeenCalled();
  });

  it.each([
    ["antigravity", 403, "Access denied"],
    ["antigravity", 429, "Quota exceeded"],
    ["vertex", 403, message],
  ])("preserves other account failure handling (%s %s)", async (provider, status, error) => {
    const result = await markAccountUnavailable("account-a", status, error, provider, "model");
    expect(result.shouldFallback).toBe(true);
    expect(db.updateProviderConnection).toHaveBeenCalledOnce();
  });
});
