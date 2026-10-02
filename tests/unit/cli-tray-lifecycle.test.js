import { describe, expect, it } from "vitest";
import { spawn } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const launcher = fileURLToPath(new URL("../../cli/cli.js", import.meta.url));

// Run the public launcher against a real disposable server. Only package setup,
// system-wide process discovery, and native tray/UI integrations are isolated.
async function runLauncher({ tray, crash }) {
  const dir = mkdtempSync(path.join(tmpdir(), "cli-lifecycle-"));
  const record = path.join(dir, "starts.json");
  mkdirSync(path.join(dir, "app"));
  copyFileSync(launcher, path.join(dir, "cli.cjs"));
  writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "lifecycle-fixture", version: "1.0.0" }));
  writeFileSync(path.join(dir, "app", "server.js"), `
    const fs = require('fs');
    const record = ${JSON.stringify(record)};
    const starts = fs.existsSync(record) ? JSON.parse(fs.readFileSync(record)) : [];
    starts.push(process.pid);
    fs.writeFileSync(record, JSON.stringify(starts));
    setTimeout(() => process.exit(${crash ? "starts.length === 1 ? 23 : 0" : "0"}), 100);
  `);
  const preload = path.join(dir, "isolate.cjs");
  writeFileSync(preload, `
    const Module = require('module');
    const fs = require('fs');
    const cp = require('child_process');
    const originalLoad = Module._load;
    cp.execSync = () => '';
    cp.exec = (_command, _options, callback) => { if (callback) callback(null, ''); };
    require('os').homedir = () => ${JSON.stringify(dir)};
    const originalExists = fs.existsSync;
    fs.existsSync = (name) => String(name).endsWith('hosts') ? false : originalExists(name);
    Object.defineProperty(process.stdin, 'isTTY', { value: true });
    Module._load = function(request, parent, isMain) {
      if (request === './hooks/sqliteRuntime') return { ensureSqliteRuntime() {}, buildEnvWithRuntime: env => env };
      if (request === './hooks/runtimeSecrets') return { buildSecretsEnv: () => ({}), getSecretsPath: () => '' };
      if (request === './hooks/nodeFlags') return { resolveHeapFlags: () => [] };
      if (request === './hooks/trayRuntime') return { ensureTrayRuntime() {} };
      if (request === './src/cli/tray/tray') return { initTray() {}, killTray() {} };
      return originalLoad.call(this, request, parent, isMain);
    };
  `);
  const child = spawn(process.execPath, ["--require", preload, path.join(dir, "cli.cjs"), "--skip-update", "--no-browser", "--host", "127.0.0.1", ...(tray ? ["--tray"] : [])], {
    env: { ...process.env, APPDATA: dir, DATA_DIR: dir, SystemRoot: dir },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", chunk => { output += chunk; });
  child.stderr.on("data", chunk => { output += chunk; });
  const watchdog = setTimeout(() => child.kill(), 6000);
  try {
    const code = await new Promise((resolve, reject) => {
      child.on("error", reject);
      child.on("close", resolve);
    });
    const pids = JSON.parse(readFileSync(record, "utf8"));
    return { code, pids, output };
  } finally {
    clearTimeout(watchdog);
    child.kill();
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("public CLI child lifecycle", () => {
  it.each([true, false])("recovers a crashed server once and exits on clean close (tray=%s)", async tray => {
    const result = await runLauncher({ tray, crash: true });
    expect(result.code).toBe(0);
    expect(result.pids).toHaveLength(2);
    expect(result.pids[0]).not.toBe(result.pids[1]);
    expect(result.output.match(/Restarting in/g)).toHaveLength(1);
  }, 10000);

  it("exits tray mode without restarting when its server closes cleanly", async () => {
    const result = await runLauncher({ tray: true, crash: false });
    expect(result.code).toBe(0);
    expect(result.pids).toHaveLength(1);
    expect(result.output).not.toContain("Restarting in");
  }, 10000);

});
