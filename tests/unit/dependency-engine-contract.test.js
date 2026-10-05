import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function manifest(relativePath) {
  return JSON.parse(readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8"));
}

describe("stable dependency runtime contract", () => {
  for (const file of ["package.json", "cli/package.json", "tests/package.json", "gitbook/package.json"]) {
    it(`${file} declares the Node floor required by the upgraded gateway`, () => {
      expect(manifest(file).engines?.node).toBe(">=22.19.0");
    });
  }

  it("aligns React, React DOM and React Is across consumers", () => {
    const root = manifest("package.json").dependencies;
    expect(root.react).toBe(root["react-dom"]);
    expect(root["react-is"]).toBe(root.react);
    for (const file of ["cli/package.json", "gitbook/package.json"]) {
      const deps = manifest(file).dependencies;
      expect(deps.react).toBe(root.react);
      expect(deps["react-dom"]).toBe(root.react);
    }
  });

  it("uses the installed test workspace runner instead of an unbounded npx lookup", () => {
    expect(manifest("package.json").scripts.test).toBe("node tests/node_modules/vitest/vitest.mjs run --config tests/vitest.config.js");
  });

  it("does not declare proxy packages with no source consumers", () => {
    const deps = manifest("package.json").dependencies;
    expect(deps).not.toHaveProperty("http-proxy-middleware");
    expect(deps).not.toHaveProperty("socks-proxy-agent");
  });

  it("compiles the MITM bundle for the supported Node major", () => {
    const source = readFileSync(new URL("../../cli/scripts/buildMitm.js", import.meta.url), "utf8");
    expect(source).toMatch(/target:\s*["']node22["']/);
  });
});
