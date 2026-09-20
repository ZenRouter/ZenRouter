import { describe, it, expect } from "vitest";
import {
  isLoopbackOAuthOrigin,
  isTrustedOAuthMessageOrigin,
  resolveOAuthRedirectUri,
  supportsPublicOAuthCallback,
} from "../../src/shared/utils/oauthRedirect.js";
import {
  getDashboardOrigins,
  isLoopbackRedirectUri,
  normalizeOAuthOrigin,
  redirectUriMatchesRequest,
} from "../../src/app/api/oauth/[provider]/[action]/route.js";

describe("smart OAuth callback routing (#4054)", () => {
  it.each(["cline", "clinepass", "gitlab", "iflow", "kimchi"])(
    "%s returns to the current public domain",
    (provider) => {
      expect(supportsPublicOAuthCallback(provider)).toBe(true);
      expect(resolveOAuthRedirectUri(provider, "https://ai.example.com")).toBe(
        "https://ai.example.com/callback",
      );
      expect(resolveOAuthRedirectUri(provider, "https://zen.ai.example.com:8443")).toBe(
        "https://zen.ai.example.com:8443/callback",
      );
    },
  );

  it("retains provider-required fixed loopback callbacks", () => {
    expect(resolveOAuthRedirectUri("codex", "https://ai.example.com")).toBe(
      "http://localhost:1455/auth/callback",
    );
    expect(resolveOAuthRedirectUri("xai", "https://ai.example.com")).toBe(
      "http://127.0.0.1:56121/callback",
    );
  });

  it("retains loopback with port 8080 on remote access for installed-app OAuth providers (Claude, Antigravity, Gemini)", () => {
    expect(resolveOAuthRedirectUri("claude", "https://ai.example.com")).toBe(
      "http://localhost:8080/callback",
    );
    expect(resolveOAuthRedirectUri("antigravity", "https://ai.example.com")).toBe(
      "http://localhost:8080/callback",
    );
    expect(resolveOAuthRedirectUri("gemini-cli", "https://ai.example.com")).toBe(
      "http://localhost:8080/callback",
    );
  });

  it("uses loopback when the dashboard itself is local", () => {
    expect(resolveOAuthRedirectUri("claude", "http://localhost:20128")).toBe(
      "http://localhost:20128/callback",
    );
    expect(isLoopbackOAuthOrigin("http://127.0.0.1:20128")).toBe(true);
  });

  it("strictly validates postMessage origins (no substring trust)", () => {
    expect(isTrustedOAuthMessageOrigin("https://ai.example.com", "https://ai.example.com")).toBe(true);
    expect(isTrustedOAuthMessageOrigin("https://ai.example.com", "http://localhost:20128")).toBe(true);
    expect(isTrustedOAuthMessageOrigin("https://ai.example.com", "https://localhost.attacker.example")).toBe(false);
    expect(isTrustedOAuthMessageOrigin("https://ai.example.com", "https://evil.example")).toBe(false);
  });

  it("server accepts same-origin public callbacks and loopback callbacks", () => {
    const request = new Request("https://ai.example.com/api/oauth/claude/authorize");
    expect(redirectUriMatchesRequest(request, "https://ai.example.com/callback")).toBe(true);
    expect(redirectUriMatchesRequest(request, "http://localhost:1455/auth/callback")).toBe(true);
    expect(isLoopbackRedirectUri("http://[::1]:20128/callback")).toBe(true);
  });

  it("server rejects attacker or sibling-subdomain callback origins", () => {
    const request = new Request("https://ai.example.com/api/oauth/claude/authorize");
    expect(redirectUriMatchesRequest(request, "https://evil.example/callback")).toBe(false);
    expect(redirectUriMatchesRequest(request, "https://other.ai.example.com/callback")).toBe(false);
    expect(redirectUriMatchesRequest(request, "https://ai.example.com:9999/callback")).toBe(false);
    expect(redirectUriMatchesRequest(request, "not a url")).toBe(false);
  });

  it("accepts https public callback when the tunnel forwards plain http (#prod zen.hlcyn.xyz)", () => {
    // cloudflared terminates TLS and talks plain HTTP to 127.0.0.1:20128
    // without x-forwarded-proto, so request.url is http:// while the
    // browser uses https:// for the same host.
    const viaTunnel = new Request("http://zen.hlcyn.xyz/api/oauth/claude/authorize");
    expect(redirectUriMatchesRequest(viaTunnel, "https://zen.hlcyn.xyz/callback")).toBe(true);
    const directTls = new Request("https://zen.hlcyn.xyz/api/oauth/claude/authorize");
    expect(redirectUriMatchesRequest(directTls, "http://zen.hlcyn.xyz/callback")).toBe(true);
  });

  it("treats loopback hosts as equivalent", () => {
    expect(normalizeOAuthOrigin("http://127.0.0.1:20128/callback")).toBe(
      normalizeOAuthOrigin("http://localhost:20128/callback"),
    );
    const request = new Request("http://127.0.0.1:20128/api/oauth/claude/authorize");
    expect(redirectUriMatchesRequest(request, "http://localhost:20128/callback")).toBe(true);
  });

  it("honors x-forwarded-host/proto from a trusted proxy", () => {
    const request = new Request("http://localhost:20128/api/oauth/claude/authorize", {
      headers: { "x-forwarded-host": "ai.example.com", "x-forwarded-proto": "https" },
    });
    expect(getDashboardOrigins(request).has("https://ai.example.com")).toBe(true);
    expect(redirectUriMatchesRequest(request, "https://ai.example.com/callback")).toBe(true);
    expect(redirectUriMatchesRequest(request, "https://evil.example/callback")).toBe(false);
  });

  it("honors Cloudflare cf-visitor scheme", () => {
    const request = new Request("http://zen.hlcyn.xyz/api/oauth/claude/authorize", {
      headers: { "cf-visitor": '{"scheme":"https"}' },
    });
    expect(redirectUriMatchesRequest(request, "https://zen.hlcyn.xyz/callback")).toBe(true);
    expect(redirectUriMatchesRequest(request, "https://evil.example/callback")).toBe(false);
  });

  it("honors NEXT_PUBLIC_BASE_URL as a dashboard origin", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://dash.example.com";
    try {
      const request = new Request("http://localhost:20128/api/oauth/claude/authorize");
      expect(redirectUriMatchesRequest(request, "https://dash.example.com/callback")).toBe(true);
      expect(redirectUriMatchesRequest(request, "https://evil.example/callback")).toBe(false);
    } finally {
      delete process.env.NEXT_PUBLIC_BASE_URL;
    }
  });
});
