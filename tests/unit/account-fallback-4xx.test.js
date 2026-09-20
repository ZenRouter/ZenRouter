import { describe, expect, it } from "vitest";
import { checkFallbackError } from "../../open-sse/services/accountFallback.js";

describe("checkFallbackError — request-scoped vs account-scoped failures (#20a43f5a2)", () => {
  it("does not cool the account down for a 400 caused by the request payload", () => {
    const result = checkFallbackError(400, JSON.stringify({
      error: {
        message: "This model's maximum context length is 1048576 tokens. However, you requested 1186139 tokens",
        type: "invalid_request_error",
      },
    }));

    expect(result).toEqual({ shouldFallback: false, cooldownMs: 0 });
  });

  it("does not cool the account down for 405, 413, or 415 client errors", () => {
    expect(checkFallbackError(405, "Method Not Allowed")).toEqual({ shouldFallback: false, cooldownMs: 0 });
    expect(checkFallbackError(413, "Payload Too Large")).toEqual({ shouldFallback: false, cooldownMs: 0 });
    expect(checkFallbackError(415, "Unsupported Media Type")).toEqual({ shouldFallback: false, cooldownMs: 0 });
  });

  it("still falls back for account-scoped statuses", () => {
    for (const status of [401, 402, 403, 404, 429]) {
      expect(checkFallbackError(status, "nope").shouldFallback).toBe(true);
    }
  });

  it("still honours rate-limit / quota wording on any 4xx", () => {
    expect(checkFallbackError(400, "rate limit reached").shouldFallback).toBe(true);
    expect(checkFallbackError(422, "quota exceeded").shouldFallback).toBe(true);
  });

  it("keeps the transient cooldown for unmatched server errors (5xx)", () => {
    const result = checkFallbackError(503, "upstream exploded");
    expect(result.shouldFallback).toBe(true);
    expect(result.cooldownMs).toBeGreaterThan(0);
  });
});
