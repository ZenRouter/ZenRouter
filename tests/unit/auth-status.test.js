import { describe, it, expect, vi, beforeEach } from "vitest";
import { usesDefaultPassword as realUsesDefaultPassword } from "../../src/lib/auth/dashboardSession.js";

const mocks = vi.hoisted(() => ({
  json: vi.fn((body, init) => ({
    status: init?.status || 200,
    body,
  })),
  cookies: vi.fn(),
  getSettings: vi.fn(),
  isOidcConfigured: vi.fn(),
  getDashboardAuthSession: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: { json: mocks.json },
}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));

vi.mock("@/lib/localDb", () => ({
  getSettings: mocks.getSettings,
}));

vi.mock("@/lib/auth/oidc", () => ({
  isOidcConfigured: mocks.isOidcConfigured,
}));

vi.mock("@/lib/auth/dashboardSession", async (importOriginal) => ({
  ...(await importOriginal()),
  getDashboardAuthSession: mocks.getDashboardAuthSession,
}));

const { GET } = await import("../../src/app/api/auth/status/route.js");

describe("GET /api/auth/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSettings.mockResolvedValue({ requireLogin: true, authMode: "password" });
    mocks.cookies.mockResolvedValue({ get: vi.fn(() => ({ value: "session-token" })) });
    mocks.isOidcConfigured.mockReturnValue(false);
  });

  it("reports an authenticated session when the auth cookie is valid", async () => {
    mocks.getDashboardAuthSession.mockResolvedValue({ authenticated: true });

    const response = await GET();

    expect(response.body.authenticated).toBe(true);
    expect(mocks.getDashboardAuthSession).toHaveBeenCalledWith("session-token");
  });

  it("reports unauthenticated when the auth cookie is invalid", async () => {
    mocks.getDashboardAuthSession.mockResolvedValue(null);

    const response = await GET();

    expect(response.body.authenticated).toBe(false);
  });

  it("fails closed when status dependencies throw", async () => {
    mocks.getSettings.mockRejectedValue(new Error("database unavailable"));

    const response = await GET();

    expect(response.body.authenticated).toBe(false);
    expect(response.body.requireLogin).toBe(true);
    expect(response.body.usesDefaultPassword).toBe(false);
  });

  it("reports usesDefaultPassword true when no stored hash and no custom env", async () => {
    mocks.getSettings.mockResolvedValue({ requireLogin: true });
    mocks.getDashboardAuthSession.mockResolvedValue(null);
    delete process.env.INITIAL_PASSWORD;

    const response = await GET();

    expect(response.body.hasPassword).toBe(false);
    expect(response.body.usesDefaultPassword).toBe(true);
  });

  it("reports usesDefaultPassword false when a custom hash is stored", async () => {
    mocks.getSettings.mockResolvedValue({ requireLogin: true, password: "bcrypt-hash" });
    mocks.getDashboardAuthSession.mockResolvedValue(null);

    const response = await GET();

    expect(response.body.hasPassword).toBe(true);
    expect(response.body.usesDefaultPassword).toBe(false);
  });
});

describe("usesDefaultPassword helper (real implementation)", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("true when no stored hash and no custom INITIAL_PASSWORD", () => {
    delete process.env.INITIAL_PASSWORD;
    expect(realUsesDefaultPassword({})).toBe(true);
    expect(realUsesDefaultPassword(null)).toBe(true);
  });

  it("false when a custom hash is stored, regardless of env", () => {
    delete process.env.INITIAL_PASSWORD;
    expect(realUsesDefaultPassword({ password: "bcrypt-hash" })).toBe(false);
    vi.stubEnv("INITIAL_PASSWORD", "s3cret-env");
    expect(realUsesDefaultPassword({ password: "bcrypt-hash" })).toBe(false);
  });

  it("false when a real INITIAL_PASSWORD env is set", () => {
    vi.stubEnv("INITIAL_PASSWORD", "s3cret-env");
    expect(realUsesDefaultPassword({})).toBe(false);
  });

  it("true for placeholder env values (treated as unset)", () => {
    for (const v of ["change-me", "change-me-to-a-long-random-secret", "  "]) {
      vi.stubEnv("INITIAL_PASSWORD", v);
      expect(realUsesDefaultPassword({})).toBe(true);
    }
  });
});
