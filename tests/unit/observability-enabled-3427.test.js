import { describe, expect, it } from "vitest";
import { resolveObservabilityEnabled } from "@/lib/db/repos/requestDetailsRepo.js";

const OFF = { enableObservability: false };
const ON = { enableObservability: true };

describe("observability enable resolution (#3427)", () => {
  it("uses the dashboard toggle when no environment flag is set", () => {
    expect(resolveObservabilityEnabled(OFF, {})).toBe(false);
    expect(resolveObservabilityEnabled(ON, {})).toBe(true);
  });

  it("honors the documented OBSERVABILITY_ENABLED flag over ENABLE_REQUEST_LOGS", () => {
    expect(resolveObservabilityEnabled(OFF, {
      ENABLE_REQUEST_LOGS: "false",
      OBSERVABILITY_ENABLED: "true",
    })).toBe(true);
  });

  it("keeps ENABLE_REQUEST_LOGS as a legacy override when the feature flag is unset", () => {
    expect(resolveObservabilityEnabled(ON, { ENABLE_REQUEST_LOGS: "false" })).toBe(false);
    expect(resolveObservabilityEnabled(OFF, { ENABLE_REQUEST_LOGS: "true" })).toBe(true);
  });

  it("treats empty environment values as unset", () => {
    expect(resolveObservabilityEnabled(ON, { OBSERVABILITY_ENABLED: " " })).toBe(true);
  });
});