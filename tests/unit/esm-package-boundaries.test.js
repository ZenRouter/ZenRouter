import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const env = { ...process.env };
delete env.NODE_OPTIONS;
delete env.NODE_NO_WARNINGS;

function nodeImport(file, assertion = "") {
  return spawnSync(process.execPath, ["--input-type=module", "-e", `
    import assert from "node:assert/strict";
    const imported = await import(${JSON.stringify(new URL(file, new URL("../../", import.meta.url)).href)});
    ${assertion}
  `], { cwd: root, env, encoding: "utf8", timeout: 10000 });
}

describe("Scoped source ESM package boundaries", () => {
  it("loads the routing executor without module-type detection warnings", () => {
    const result = nodeImport("open-sse/executors/base.js", 'assert.equal(typeof imported.BaseExecutor, "function");');
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).not.toContain("MODULE_TYPELESS_PACKAGE_JSON");
  });

  it("loads the native Zed utility without module-type detection warnings", () => {
    const result = nodeImport("src/lib/oauth/utils/zedCredentials.js", 'assert.equal(typeof imported.readZedSystemId, "function");');
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).not.toContain("MODULE_TYPELESS_PACKAGE_JSON");
  });

  it.each(["open-sse", "src/lib/oauth/utils", "src/sse"])("declares %s as ESM", (directory) => {
    const file = resolve(root, directory, "package.json");
    expect(JSON.parse(readFileSync(file, "utf8"))).toEqual({ type: "module" });
  });

  it("leaves root, CLI, updater, MCP and MITM in their existing CommonJS scopes", () => {
    const rootManifest = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
    expect(rootManifest.type).toBeUndefined();
    const cliManifest = JSON.parse(readFileSync(resolve(root, "cli/package.json"), "utf8"));
    expect(cliManifest.type).not.toBe("module");
    for (const directory of ["src", "src/lib", "src/mitm", "src/lib/updater", "src/lib/mcp", "src/shared"]) {
      expect(readdirSync(resolve(root, directory))).not.toContain("package.json");
    }
  });

  it("keeps CommonJS custom-server and updater parseable", () => {
    for (const file of ["custom-server.js", "cli/cli.js", "src/lib/updater/updater.js", "src/mitm/server.js", "src/lib/mcp/stdioSseBridge.js"]) {
      const result = spawnSync(process.execPath, ["--check", file], { cwd: root, env, encoding: "utf8", timeout: 10000 });
      expect(result.status, result.stderr).toBe(0);
    }
  });
});
