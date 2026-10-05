import { expect, it } from "vitest";
import { readFileSync } from "node:fs";

it("does not disable TLS verification globally in the MITM fixture", () => {
  const source = readFileSync(new URL("./proxy-fetch-bypass-headers.test.js", import.meta.url), "utf8");
  expect(source).not.toMatch(/process\.env\.NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*["']0["']/);
});
