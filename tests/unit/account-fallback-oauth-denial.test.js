import { describe, expect, it } from "vitest";
import { checkFallbackError, isPermanentAuthDenial } from "../../open-sse/services/accountFallback.js";

const OAUTH_DENIAL_BODY = JSON.stringify({
  type: "error",
  error: {
    type: "permission_error",
    message: "OAuth authentication is currently not allowed for this organization.",
    details: { error_code: "oauth_not_allowed_for_organization" },
  },
});

describe("isPermanentAuthDenial", () => {
  it("detects Anthropic oauth_not_allowed_for_organization on 403", () => {
    expect(isPermanentAuthDenial(403, OAUTH_DENIAL_BODY)).toBe(true);
  });

  it("detects Claude Code oauth_org_not_allowed on 403", () => {
    expect(isPermanentAuthDenial(403, "oauth_org_not_allowed")).toBe(true);
  });

  it("is case-insensitive and accepts non-string bodies", () => {
    expect(isPermanentAuthDenial(403, { error: { message: "ORGANIZATION HAS DISABLED subscription access" } })).toBe(true);
  });

  it("returns false for ordinary quota/rate 403s", () => {
    expect(isPermanentAuthDenial(403, "quota exceeded")).toBe(false);
    expect(isPermanentAuthDenial(403, "permission_error: insufficient_quota")).toBe(false);
  });

  it("returns false for non-401/403 statuses", () => {
    expect(isPermanentAuthDenial(429, OAUTH_DENIAL_BODY)).toBe(false);
    expect(isPermanentAuthDenial(500, OAUTH_DENIAL_BODY)).toBe(false);
  });

  it("returns false for empty bodies", () => {
    expect(isPermanentAuthDenial(403, "")).toBe(false);
    expect(isPermanentAuthDenial(403, null)).toBe(false);
  });
});

describe("checkFallbackError — permanent OAuth denial is terminal with long cooldown", () => {
  it("marks oauth_not_allowed_for_organization terminal (still falls back once, long lock)", () => {
    const result = checkFallbackError(403, OAUTH_DENIAL_BODY);
    expect(result.shouldFallback).toBe(true);
    expect(result.terminal).toBe(true);
    expect(result.cooldownMs).toBe(15 * 60 * 1000);
  });

  it("marks organization-disabled denial terminal", () => {
    const result = checkFallbackError(403, "Your organization has disabled Claude subscription access");
    expect(result.terminal).toBe(true);
    expect(result.shouldFallback).toBe(true);
  });

  it("keeps ordinary 403 quota errors transient (2m cooldown, non-terminal)", () => {
    const result = checkFallbackError(403, "quota exceeded for this billing account");
    expect(result.terminal).toBeFalsy();
    expect(result.shouldFallback).toBe(true);
  });
});
