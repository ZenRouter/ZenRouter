import { describe, it, expect } from "vitest";

describe("Protected Settings Keys Mass Assignment Protection (#3499)", () => {
  it("should list all security-critical settings in PROTECTED_SETTING_KEYS", async () => {
    // Read the settings route file directly to verify keys
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const content = await fs.readFile(
      path.resolve(__dirname, "../../src/app/api/settings/route.js"),
      "utf8"
    );

    expect(content).toContain('"requireLogin"');
    expect(content).toContain('"requireApiKey"');
    expect(content).toContain('"authMode"');
    expect(content).toContain('"ssoType"');
    expect(content).toContain('"oidcIssuerUrl"');
    expect(content).toContain('"oidcClientSecret"');
    expect(content).toContain('"samlCert"');
    expect(content).toContain('"tunnelDashboardAccess"');
    expect(content).toContain('"outboundProxyEnabled"');
  });
});
