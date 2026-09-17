import { describe, it, expect, vi, afterEach } from "vitest";
import { isApiKeyRequired } from "@/lib/db/repos/settingsRepo.js";
import * as dbIndex from "@/lib/db/index.js";
import * as localDb from "@/lib/localDb.js";

// 9Router #2834: REQUIRE_API_KEY was documented in README/.env.example as
// enforcing Bearer keys on /v1/* for internet-exposed deploys, but nothing
// in the runtime read it. The env var now acts as a one-way override: it can
// only ever turn enforcement ON, never off.
describe("REQUIRE_API_KEY env bridge (#2834)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("dashboard setting true enforces regardless of env", () => {
    vi.stubEnv("REQUIRE_API_KEY", "");
    expect(isApiKeyRequired({ requireApiKey: true })).toBe(true);
    delete process.env.REQUIRE_API_KEY;
    expect(isApiKeyRequired({ requireApiKey: true })).toBe(true);
  });

  it("env true forces enforcement even when the dashboard setting is off", () => {
    vi.stubEnv("REQUIRE_API_KEY", "true");
    expect(isApiKeyRequired({ requireApiKey: false })).toBe(true);
    expect(isApiKeyRequired({})).toBe(true);
    expect(isApiKeyRequired(null)).toBe(true);
    expect(isApiKeyRequired(undefined)).toBe(true);
  });

  it("env unset/false keeps dashboard behavior (can stay off)", () => {
    vi.stubEnv("REQUIRE_API_KEY", "false");
    expect(isApiKeyRequired({ requireApiKey: false })).toBe(false);
    expect(isApiKeyRequired({})).toBe(false);
    delete process.env.REQUIRE_API_KEY;
    expect(isApiKeyRequired({ requireApiKey: false })).toBe(false);
  });

  it("only the exact string 'true' opts in (no truthy surprises)", () => {
    for (const v of ["1", "yes", "TRUE", "True", "on"]) {
      vi.stubEnv("REQUIRE_API_KEY", v);
      expect(isApiKeyRequired({ requireApiKey: false })).toBe(false);
    }
  });

  it("is exported through the DB barrel and the localDb shim", () => {
    expect(typeof dbIndex.isApiKeyRequired).toBe("function");
    expect(typeof localDb.isApiKeyRequired).toBe("function");
    expect(localDb.isApiKeyRequired).toBe(dbIndex.isApiKeyRequired);
  });
});
