import { describe, it, expect } from "vitest";
import {
  isLoopbackOAuthOrigin,
  isTrustedOAuthMessageOrigin,
  resolveOAuthRedirectUri,
  supportsPublicOAuthCallback,
} from "../../src/shared/utils/oauthRedirect.js";
import {
  isLoopbackRedirectUri,
  redirectUriMatchesRequest,
} from "../../src/app/api/oauth/[provider]/[action]/route.js";

describe("smart OAuth callback routing (#4054)", () => {
  it.each(["claude", "cline", "clinepass", "gitlab", "iflow", "kimchi"])(
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

  it("retains loopback for installed-app Google OAuth providers", () => {
    expect(resolveOAuthRedirectUri("antigravity", "https://ai.example.com")).toBe(
      "http://localhost:443/callback",
    );
    expect(resolveOAuthRedirectUri("gemini-cli", "https://ai.example.com:8443")).toBe(
      "http://localhost:8443/callback",
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
    expect(redirectUriMatchesRequest(request, "not a url")).toBe(false);
  });
});
