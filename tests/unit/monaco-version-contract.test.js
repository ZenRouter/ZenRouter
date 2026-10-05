import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const source = fs.readFileSync(new URL("../../src/app/(dashboard)/dashboard/translator/page.js", import.meta.url), "utf8");

describe("translator editor stable runtime", () => {
  it("configures the wrapper with installed ESM Monaco instead of its stale CDN default", () => {
    expect(source).toMatch(/import\(["']monaco-editor\/index\.js["']\)/);
    expect(source).toMatch(/loader\.config\(\{\s*monaco\s*\}\)/);
    const installed = JSON.parse(fs.readFileSync(new URL("../../node_modules/monaco-editor/package.json", import.meta.url), "utf8"));
    expect(installed.version).toBe(require("../../package.json").dependencies["monaco-editor"].replace(/^\^/, ""));
  });

  it("bundles explicit JSON and editor module workers instead of raw emitted ESM assets", () => {
    expect(source).toMatch(/MonacoEnvironment\s*=\s*\{/);
    expect(source).toMatch(/new Worker\(new URL\(["']monaco-editor\/language\/json\/json\.worker\.js["']/);
    expect(source).toMatch(/new Worker\(new URL\(["']monaco-editor\/editor\/editor\.worker\.js["']/);
  });
});
