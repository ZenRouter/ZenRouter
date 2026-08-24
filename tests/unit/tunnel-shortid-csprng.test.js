import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { generateShortId } from "@/lib/tunnel/shared/state.js";

const CHARSET = "abcdefghijklmnpqrstuvwxyz23456789";

describe("tunnel short id", () => {
  it("keeps its length and alphabet", () => {
    for (let i = 0; i < 500; i++) {
      const id = generateShortId();
      expect(id).toHaveLength(6);
      for (const char of id) expect(CHARSET).toContain(char);
    }
  });

  it("keeps excluding the characters that misread aloud", () => {
    const ids = Array.from({ length: 500 }, generateShortId).join("");
    for (const char of ["o", "0", "1"]) expect(ids).not.toContain(char);
  });

  it("does not repeat itself across a large draw", () => {
    const ids = new Set(Array.from({ length: 5_000 }, generateShortId));
    expect(ids.size).toBeGreaterThan(4_990);
  });

  it("uses the whole alphabet", () => {
    const seen = new Set(Array.from({ length: 3_000 }, generateShortId).join(""));
    expect(seen.size).toBe(CHARSET.length);
  });

  it("is drawn from the crypto module, not Math.random", () => {
    const src = fs.readFileSync(
      new URL("../../src/lib/tunnel/shared/state.js", import.meta.url),
      "utf8"
    );
    const body = src.slice(src.indexOf("export function generateShortId"));
    expect(body).toContain("randomInt(0, SHORT_ID_CHARS.length)");
    expect(/Math\.random\s*\(\)/.test(body)).toBe(false);
    expect(src).toMatch(/from "crypto"|from "node:crypto"/);
  });
});
