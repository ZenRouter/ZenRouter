import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const { getProviderNodeById } = vi.hoisted(() => ({ getProviderNodeById: vi.fn() }));
vi.mock("@/models", () => ({ getProviderNodeById }));
vi.mock("@/lib/localDb", () => ({ getProviderConnectionById: vi.fn(), updateProviderConnection: vi.fn() }));
vi.mock("@/lib/network/connectionProxy", () => ({ resolveConnectionProxyConfig: vi.fn() }));
vi.mock("@/lib/network/proxyTest", () => ({ testProxyUrl: vi.fn() }));

import { POST } from "../../src/app/api/providers/validate/route.js";
import { testApiKeyConnection } from "../../src/app/api/providers/[id]/test/testUtils.js";

const activeHaiku = "claude-haiku-4-5-20251001";
const compatibleProvider = "anthropic-compatible-probe-fixture";
const paths = [
  ["Anthropic validation", "anthropic", "validate"],
  ["compatible validation", compatibleProvider, "validate"],
  ["Anthropic retest", "anthropic", "retest"],
  ["compatible retest", compatibleProvider, "retest"],
];

async function probe(provider, operation, defaultModel) {
  getProviderNodeById.mockResolvedValue({ baseUrl: "https://probe.example", defaultModel });
  if (operation === "validate") {
    const response = await POST(new Request("http://localhost/api/providers/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey: "synthetic-probe-key", defaultModel }),
    }));
    expect(response.status).toBe(200);
    return response.json();
  }
  return testApiKeyConnection({ provider, apiKey: "synthetic-probe-key", defaultModel, providerSpecificData: { baseUrl: "https://probe.example" } });
}

describe("Anthropic credential probe models", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
  });
  afterEach(() => vi.unstubAllGlobals());

  it.each(paths)("%s uses active inexpensive Haiku", async (_, provider, operation) => {
    expect((await probe(provider, operation)).valid).toBe(true);
    expect(JSON.parse(fetch.mock.calls[0][1].body).model).toBe(activeHaiku);
  });

  it.each(paths.filter(([, provider]) => provider === compatibleProvider))("%s preserves configured model", async (_, provider, operation) => {
    await probe(provider, operation, "custom-upstream-model");
    expect(JSON.parse(fetch.mock.calls[0][1].body).model).toBe("custom-upstream-model");
  });

  it.each(paths)("%s rejects unauthorized credentials", async (_, provider, operation) => {
    fetch.mockResolvedValue(new Response("{}", { status: 401 }));
    expect((await probe(provider, operation)).valid).toBe(false);
  });

  it.each(paths)("%s retains forbidden-response policy", async (_, provider, operation) => {
    fetch.mockResolvedValue(new Response("{}", { status: 403 }));
    expect((await probe(provider, operation)).valid).toBe(provider === "anthropic");
  });
});
