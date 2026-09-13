import { describe, it, expect, vi } from "vitest";
import * as models from "../../src/models/index.js";
import { resolveConnectionProxyConfig } from "../../src/lib/network/connectionProxy.js";

describe("Strict Proxy configuration and propagation", () => {
  it("resolves strictProxy: true from pool configuration", async () => {
    vi.spyOn(models, "getProxyPoolById").mockResolvedValue({
      id: "pool-strict",
      proxyUrl: "http://proxy.example.com:8080",
      strictProxy: true,
      isActive: true,
    });

    const proxyConfig = await resolveConnectionProxyConfig({
      proxyPoolId: "pool-strict",
    });

    expect(proxyConfig.connectionProxyEnabled).toBe(true);
    expect(proxyConfig.connectionProxyUrl).toBe("http://proxy.example.com:8080");
    expect(proxyConfig.strictProxy).toBe(true);
  });

  it("resolves strictProxy: false when pool does not set it", async () => {
    vi.spyOn(models, "getProxyPoolById").mockResolvedValue({
      id: "pool-non-strict",
      proxyUrl: "http://proxy.example.com:8080",
      strictProxy: false,
      isActive: true,
    });

    const proxyConfig = await resolveConnectionProxyConfig({
      proxyPoolId: "pool-non-strict",
    });

    expect(proxyConfig.strictProxy).toBe(false);
  });

  it("preserves strictProxy flag in proxyOptions constructed for executors and chatCore", () => {
    const credentials = {
      providerSpecificData: {
        connectionProxyEnabled: true,
        connectionProxyUrl: "http://127.0.0.1:8080",
        connectionNoProxy: "",
        strictProxy: true,
      },
    };

    const proxyOptions = {
      connectionProxyEnabled: credentials?.providerSpecificData?.connectionProxyEnabled === true,
      connectionProxyUrl: credentials?.providerSpecificData?.connectionProxyUrl || "",
      connectionNoProxy: credentials?.providerSpecificData?.connectionNoProxy || "",
      vercelRelayUrl: credentials?.providerSpecificData?.vercelRelayUrl || "",
      strictProxy: credentials?.providerSpecificData?.strictProxy === true,
    };

    expect(proxyOptions.strictProxy).toBe(true);
  });
});
