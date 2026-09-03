import { describe, it, expect, vi } from "vitest";
import { resolveBaseUrl, buildSearchRequest } from "open-sse/handlers/search/callers.js";

describe("SearXNG Docker SSRF guard fix (#3756)", () => {
  it("allows admin-configured internal/docker baseUrl when no client override is present", () => {
    const adminConfig = {
      id: "searxng",
      baseUrl: "http://searxng:8080/search",
    };
    const params = {
      query: "test query",
      searchType: "web",
      maxResults: 5,
    };

    const resolved = resolveBaseUrl(adminConfig, params);
    expect(resolved).toBe("http://searxng:8080/search");

    const req = buildSearchRequest(adminConfig, params);
    expect(req.url).toContain("http://searxng:8080/search?q=test+query");
  });

  it("blocks client-supplied internal baseUrl overrides via assertPublicUrl", () => {
    const adminConfig = {
      id: "searxng",
      baseUrl: "http://searxng:8080/search",
    };
    const paramsWithMaliciousOverride = {
      query: "test query",
      searchType: "web",
      maxResults: 5,
      providerOptions: {
        baseUrl: "http://127.0.0.1:20128/api/settings",
      },
    };

    expect(() => {
      resolveBaseUrl(adminConfig, paramsWithMaliciousOverride);
    }).toThrow(/Blocked URL/);
  });

  it("blocks client-supplied AWS metadata endpoint override", () => {
    const adminConfig = {
      id: "searxng",
      baseUrl: "http://searxng:8080/search",
    };
    const paramsWithMetaOverride = {
      query: "test query",
      searchType: "web",
      maxResults: 5,
      providerOptions: {
        baseUrl: "http://169.254.169.254/latest/meta-data",
      },
    };

    expect(() => {
      resolveBaseUrl(adminConfig, paramsWithMetaOverride);
    }).toThrow(/Blocked URL/);
  });
});
