import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const script = fileURLToPath(new URL("../../scripts/check-release-version.mjs", import.meta.url));
const fixtures = [];
afterEach(() => { for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true }); });
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "zenrouter-release-guard-"));
  fixtures.push(root);
  for (const prefix of ["", "cli/", "tests/", "gitbook/"]) {
    mkdirSync(resolve(root, prefix), { recursive: true });
    writeFileSync(resolve(root, prefix + "package.json"), JSON.stringify({ name: prefix === "cli/" ? "@joyccn/zenrouter" : "fixture", version: "0.9.7" }));
    writeFileSync(resolve(root, prefix + "package-lock.json"), JSON.stringify({ version: "0.9.7", packages: { "": { version: "0.9.7" } } }));
  }
  return root;
}
function run(root, tag) {
  const code = `import { checkReleaseVersion } from ${JSON.stringify(pathToFileURL(script).href)}; console.log(JSON.stringify(checkReleaseVersion(${JSON.stringify(root)}, ${JSON.stringify(tag)})));`;
  return spawnSync(process.execPath, ["--input-type=module", "-e", code], { encoding: "utf8" });
}

describe("release publication version guard", () => {
  it("accepts a stable tag matching every package and lock root", () => {
    const result = run(fixture(), "v0.9.7");
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ tag: "v0.9.7", version: "0.9.7" });
  });

  it.each(["0.9.7", "v0.9.7-beta", "v00.9.7", "v0.9.7\n"])("rejects malformed tag %j without normalizing it", tag => {
    const result = run(fixture(), tag);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Invalid stable release tag");
  });

  it("rejects a tag that does not match the source version", () => {
    const result = run(fixture(), "v0.9.8");
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Version mismatch");
  });

  it("rejects stale lock root metadata before any publish", () => {
    const root = fixture();
    writeFileSync(join(root, "cli/package-lock.json"), JSON.stringify({ version: "0.9.7", packages: { "": { version: "0.0.0" } } }));
    const result = run(root, "v0.9.7");
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Version mismatch");
  });
});
