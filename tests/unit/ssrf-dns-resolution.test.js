import { describe, it, expect, vi } from "vitest";
import { assertPublicUrl, assertPublicUrlAsync, isBlockedIpv4, isBlockedIpv6 } from "../../src/shared/utils/ssrfGuard.js";

describe("SSRF Guard - Extended Range & DNS Rebinding", () => {
  it("blocks private IPv4 ranges", () => {
    expect(isBlockedIpv4("127.0.0.1")).toBe(true);
    expect(isBlockedIpv4("10.0.0.1")).toBe(true);
    expect(isBlockedIpv4("192.168.1.1")).toBe(true);
    expect(isBlockedIpv4("172.16.0.1")).toBe(true);
    expect(isBlockedIpv4("169.254.169.254")).toBe(true);
    expect(isBlockedIpv4("100.64.0.1")).toBe(true); // CGNAT
    expect(isBlockedIpv4("8.8.8.8")).toBe(false);   // Public
    expect(isBlockedIpv4("1.1.1.1")).toBe(false);   // Public
  });

  it("blocks private IPv6 ranges", () => {
    expect(isBlockedIpv6("::1")).toBe(true);
    expect(isBlockedIpv6("fe80::1")).toBe(true);
    expect(isBlockedIpv6("fc00::1")).toBe(true);
    expect(isBlockedIpv6("fd00::1")).toBe(true);
    expect(isBlockedIpv6("::ffff:127.0.0.1")).toBe(true);
    expect(isBlockedIpv6("::ffff:8.8.8.8")).toBe(false);
  });

  it("synchronously blocks private URL literals", () => {
    expect(() => assertPublicUrl("http://127.0.0.1:8080/api")).toThrow(/private IP/);
    expect(() => assertPublicUrl("http://localhost:3000")).toThrow(/internal host/);
    expect(() => assertPublicUrl("http://service.internal/v1")).toThrow(/internal host/);
    expect(() => assertPublicUrl("http://169.254.169.254/latest/meta-data")).toThrow(/private IP/);
    expect(() => assertPublicUrl("https://api.openai.com/v1")).not.toThrow();
  });

  it("asynchronously blocks hostnames resolving to private IPs", async () => {
    await expect(assertPublicUrlAsync("http://127.0.0.1.nip.io")).rejects.toThrow(/private IP/);
    await expect(assertPublicUrlAsync("http://169.254.169.254.nip.io")).rejects.toThrow(/private IP/);
  });
});
