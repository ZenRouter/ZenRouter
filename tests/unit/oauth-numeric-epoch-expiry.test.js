import { describe, expect, it } from "vitest";
import { parseTimeMs, getCredentialExpiryMs } from "../../open-sse/services/oauthCredentialManager.js";
import { isTokenExpiringSoon } from "../../open-sse/handlers/chatCore.js";

describe("OAuth credential expiry parsing (#4000)", () => {
  it("parses numeric epoch milliseconds as string", () => {
    const futureMs = Date.now() + 3600 * 1000;
    const epochStr = String(futureMs);
    expect(parseTimeMs(epochStr)).toBe(futureMs);
    expect(getCredentialExpiryMs({ expiresAt: epochStr })).toBe(futureMs);
  });

  it("parses numeric epoch seconds as string (converts to ms)", () => {
    const futureSec = Math.floor(Date.now() / 1000) + 3600;
    const secStr = String(futureSec);
    expect(parseTimeMs(secStr)).toBe(futureSec * 1000);
  });

  it("correctly identifies expiring tokens with string epoch in isTokenExpiringSoon", () => {
    // 2 minutes from now (within 5 min buffer)
    const soonMs = Date.now() + 2 * 60 * 1000;
    expect(isTokenExpiringSoon(String(soonMs))).toBe(true);

    // 10 minutes from now (outside 5 min buffer)
    const farMs = Date.now() + 10 * 60 * 1000;
    expect(isTokenExpiringSoon(String(farMs))).toBe(false);
  });
});
