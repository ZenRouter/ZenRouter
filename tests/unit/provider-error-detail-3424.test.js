import { describe, expect, it } from "vitest";
import { describeProviderError } from "@/sse/services/auth.js";

describe("describeProviderError (#3424)", () => {
  it("preserves transport causes", () => {
    const error = new TypeError("fetch failed");
    error.cause = Object.assign(new Error("connection refused"), { code: "ECONNREFUSED" });
    expect(describeProviderError(error)).toBe("fetch failed (ECONNREFUSED)");
  });

  it("reads provider error shapes without serializing payloads", () => {
    expect(describeProviderError({ error: { message: "model not found" } })).toBe("model not found");
    expect(describeProviderError({ code: "EPIPE", request: { authorization: "secret" } })).toBe("Provider error (EPIPE)");
  });
});
