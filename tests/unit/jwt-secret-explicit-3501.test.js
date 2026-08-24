import { afterEach, describe, expect, it } from "vitest";
import { loadJwtSecret } from "@/lib/auth/dashboardSession.js";

afterEach(() => {
  delete process.env.JWT_SECRET;
});

describe("loadJwtSecret — explicit JWT_SECRET required (#3501)", () => {
  it("throws when secret is empty string", () => {
    expect(() => loadJwtSecret("")).toThrow(/JWT_SECRET environment variable is required/);
  });

  it("throws when secret is whitespace only", () => {
    expect(() => loadJwtSecret("   ")).toThrow(/JWT_SECRET environment variable is required/);
  });

  it("throws when secret is too short (< 32 chars)", () => {
    expect(() => loadJwtSecret("a".repeat(31))).toThrow(/JWT_SECRET environment variable is required/);
  });

  it("throws when secret is null", () => {
    expect(() => loadJwtSecret(null)).toThrow(/JWT_SECRET environment variable is required/);
  });

  it("throws when secret is not a string", () => {
    expect(() => loadJwtSecret(123)).toThrow(/JWT_SECRET environment variable is required/);
  });

  it("accepts a 32+ character secret", () => {
    expect(loadJwtSecret("a".repeat(32))).toHaveLength(32);
  });

  it("trims whitespace before validation", () => {
    expect(loadJwtSecret("   " + "a".repeat(32) + "   ")).toHaveLength(32);
  });
});
