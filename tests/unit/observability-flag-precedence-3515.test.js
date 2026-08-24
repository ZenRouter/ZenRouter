import { describe, expect, it } from "vitest";
import { resolveObservabilityEnabled } from "@/lib/db/repos/requestDetailsRepo.js";

describe("resolveObservabilityEnabled — feature-flag precedence (#3515)", () => {
  it("OBSERVABILITY_ENABLED=true wins regardless of ENABLE_REQUEST_LOGS", () => {
    expect(resolveObservabilityEnabled({}, { OBSERVABILITY_ENABLED: "true", ENABLE_REQUEST_LOGS: "false" })).toBe(true);
  });

  it("OBSERVABILITY_ENABLED=false wins regardless of ENABLE_REQUEST_LOGS", () => {
    expect(resolveObservabilityEnabled({}, { OBSERVABILITY_ENABLED: "false", ENABLE_REQUEST_LOGS: "true" })).toBe(false);
  });

  it("falls back to ENABLE_REQUEST_LOGS when feature flag unset", () => {
    expect(resolveObservabilityEnabled({}, { ENABLE_REQUEST_LOGS: "true" })).toBe(true);
    expect(resolveObservabilityEnabled({}, { ENABLE_REQUEST_LOGS: "false" })).toBe(false);
  });

  it("falls back to dashboard setting when no env vars set", () => {
    expect(resolveObservabilityEnabled({ enableObservability: true }, {})).toBe(true);
    expect(resolveObservabilityEnabled({ enableObservability: false }, {})).toBe(false);
  });

  it("treats empty/unset env vars as no signal (does not coerce to false)", () => {
    expect(resolveObservabilityEnabled({ enableObservability: true }, { OBSERVABILITY_ENABLED: "" })).toBe(true);
    expect(resolveObservabilityEnabled({ enableObservability: true }, { OBSERVABILITY_ENABLED: "   " })).toBe(true);
    expect(resolveObservabilityEnabled({ enableObservability: false }, { OBSERVABILITY_ENABLED: "  " })).toBe(false);
  });

  it("whitespace around env value is trimmed before parsing", () => {
    expect(resolveObservabilityEnabled({}, { OBSERVABILITY_ENABLED: "  true  " })).toBe(true);
    expect(resolveObservabilityEnabled({}, { OBSERVABILITY_ENABLED: "TRUE" })).toBe(true);
  });
});
