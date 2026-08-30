import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getProjectIdForConnection, removeConnection } from "../../open-sse/services/projectId.js";
import { refreshGoogleToken } from "../../open-sse/services/tokenRefresh/providers.js";

describe("Antigravity & Gemini-CLI Proxy Support for Project ID & Token Refresh", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("passes connection proxyOptions through getProjectIdForConnection", async () => {
    const connectionId = `proxy-test-${Date.now()}`;
    const fetchMock = vi.fn(async (url, options) => ({
      ok: true,
      json: async () => ({
        cloudaicompanionProject: { id: "proxied-gcp-project-123" }
      })
    }));
    vi.stubGlobal("fetch", fetchMock);

    const proxyOptions = {
      connectionProxyEnabled: true,
      connectionProxyUrl: "http://127.0.0.1:7890",
      connectionNoProxy: "localhost"
    };

    const projectId = await getProjectIdForConnection(connectionId, "mock-access-token", "antigravity", proxyOptions);

    expect(projectId).toBe("proxied-gcp-project-123");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://cloudcode-pa.googleapis.com/v1internal:loadCodeAssist",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer mock-access-token"
        })
      })
    );

    removeConnection(connectionId);
  });

  it("passes connection proxyOptions through refreshGoogleToken", async () => {
    const fetchMock = vi.fn(async (url, options) => ({
      ok: true,
      json: async () => ({
        access_token: "refreshed-access-token",
        refresh_token: "new-refresh-token",
        expires_in: 3600
      })
    }));
    vi.stubGlobal("fetch", fetchMock);

    const proxyOptions = {
      connectionProxyEnabled: true,
      connectionProxyUrl: "http://127.0.0.1:7890"
    };

    const result = await refreshGoogleToken("my-refresh-token", "client-id", "client-secret", null, proxyOptions);

    expect(result).toEqual({
      accessToken: "refreshed-access-token",
      refreshToken: "new-refresh-token",
      expiresIn: 3600
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://oauth2.googleapis.com/token",
      expect.objectContaining({
        method: "POST"
      })
    );
  });
});
