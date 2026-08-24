import { describe, it, expect } from "vitest";
import { assertValidAwsRegion } from "@/lib/oauth/constants/oauth";
import { assertPublicUrl } from "@/shared/utils/ssrfGuard";

describe("Security Batch 2: SSRF & Endpoint Guards (#3497, #3502)", () => {
  describe("AWS Region Allowlist (assertValidAwsRegion)", () => {
    it("should accept valid AWS regions", () => {
      expect(assertValidAwsRegion("us-east-1")).toBe("us-east-1");
      expect(assertValidAwsRegion("eu-west-1")).toBe("eu-west-1");
      expect(assertValidAwsRegion("ap-southeast-1")).toBe("ap-southeast-1");
    });

    it("should reject malicious or invalid regions", () => {
      expect(() => assertValidAwsRegion("http://169.254.169.254")).toThrow("Invalid region");
      expect(() => assertValidAwsRegion("localhost")).toThrow("Invalid region");
      expect(() => assertValidAwsRegion("us-east-1.attacker.com")).toThrow("Invalid region");
      expect(() => assertValidAwsRegion("")).toThrow("Invalid region");
      expect(() => assertValidAwsRegion(null)).toThrow("Invalid region");
    });
  });

  describe("assertPublicUrl", () => {
    it("should allow public URLs", () => {
      expect(() => assertPublicUrl("https://auth.example.com/oauth")).not.toThrow();
      expect(() => assertPublicUrl("https://8.8.8.8")).not.toThrow();
    });

    it("should reject private and local hosts", () => {
      expect(() => assertPublicUrl("http://localhost:8080")).toThrow("internal host");
      expect(() => assertPublicUrl("http://127.0.0.1:3000")).toThrow("private IP");
      expect(() => assertPublicUrl("http://169.254.169.254/latest/meta-data")).toThrow("private IP");
      expect(() => assertPublicUrl("http://192.168.1.1")).toThrow("private IP");
      expect(() => assertPublicUrl("http://10.0.0.1")).toThrow("private IP");
      expect(() => assertPublicUrl("http://app.internal")).toThrow("internal host");
    });
  });
});
