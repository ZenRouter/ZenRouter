import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  connections: [],
  getProviderConnections: vi.fn(),
  updateProviderConnection: vi.fn(),
  getSettings: vi.fn(),
}));

vi.mock("@/lib/localDb", () => ({
  getProviderConnections: mocks.getProviderConnections,
  validateApiKey: vi.fn(),
  updateProviderConnection: mocks.updateProviderConnection,
  getSettings: mocks.getSettings,
  getProxyPools: vi.fn(async () => []),
}));

vi.mock("@/lib/network/connectionProxy", () => ({
  resolveConnectionProxyConfig: vi.fn(async () => ({})),
  pickProxyPoolId: vi.fn(),
}));

vi.mock("@/sse/utils/logger.js", () => ({
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

const { getProviderCredentials } = await import("@/sse/services/auth.js");

const conn = (id) => ({
  id,
  provider: "openai",
  authType: "apikey",
  apiKey: `key-${id}`,
  isActive: true,
  providerSpecificData: {},
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.connections = [conn("a1"), conn("a2"), conn("a3")];
  mocks.getProviderConnections.mockResolvedValue(mocks.connections);
  mocks.updateProviderConnection.mockResolvedValue({});
  mocks.getSettings.mockResolvedValue({ fallbackStrategy: "session-sticky", quotaAwareSelection: false });
});

describe("session-sticky account strategy (9router #4297)", () => {
  it("pins the same session key to the same account", async () => {
    const first = await getProviderCredentials("openai", null, null, { sessionKey: "sess-abc" });
    const second = await getProviderCredentials("openai", null, null, { sessionKey: "sess-abc" });
    expect(first.connectionId).toBeDefined();
    expect(second.connectionId).toBe(first.connectionId);
  });

  it("distributes distinct sessions across accounts", async () => {
    const picked = new Set();
    for (let i = 0; i < 12; i++) {
      const c = await getProviderCredentials("openai", null, null, { sessionKey: `sess-${i}` });
      picked.add(c.connectionId);
    }
    expect(picked.size).toBeGreaterThan(1);
  });

  it("degrades to fill-first without a session key", async () => {
    const c = await getProviderCredentials("openai", null, null, {});
    expect(c.connectionId).toBe("a1");
  });

  it("skips excluded accounts when re-hashing", async () => {
    const first = await getProviderCredentials("openai", null, null, { sessionKey: "sess-abc" });
    const excluded = new Set([first.connectionId]);
    const second = await getProviderCredentials("openai", excluded, null, { sessionKey: "sess-abc" });
    expect(second.connectionId).not.toBe(first.connectionId);
  });
});
