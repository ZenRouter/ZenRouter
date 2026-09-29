#!/usr/bin/env node

// Postinstall: warm-up SQLite deps into ~/.zenrouter/runtime so the first
// `zenrouter` start doesn't need network. Failure here is non-fatal —
// cli.js will retry at runtime if anything is missing.
const { ensureSqliteRuntime } = require("./sqliteRuntime");
const { ensureTrayRuntime } = require("./trayRuntime");

// Auto-setup on install: create the data directory and generate the runtime
// secrets up front, so the very first `zenrouter` run serves the dashboard
// immediately instead of failing login with "JWT_SECRET environment variable
// is required". Idempotent — existing values are never overwritten, and an
// explicitly exported JWT_SECRET still wins.
const fs = require("fs");
const { ensureRuntimeSecrets, getSecretsPath, getDataDir } = require("./runtimeSecrets");

try {
  fs.mkdirSync(getDataDir(), { recursive: true });
  const secrets = ensureRuntimeSecrets(process.env, { silent: false });
  console.log(`[zenrouter] data dir ready: ${getDataDir()}`);
  console.log(`[zenrouter] runtime secrets ready: ${getSecretsPath()} (${Object.keys(secrets).length} keys)`);
} catch (e) {
  // Non-fatal: cli.js regenerates and persists them on first start.
  console.warn(`[zenrouter] runtime secrets setup skipped: ${e.message}`);
}

try {
  ensureSqliteRuntime({ silent: false });
  console.log("[zenrouter] runtime SQLite deps ready");
} catch (e) {
  console.warn(`[zenrouter] runtime warm-up skipped: ${e.message}`);
}

try {
  ensureTrayRuntime({ silent: false });
} catch (e) {
  console.warn(`[zenrouter] tray runtime skipped: ${e.message}`);
}

process.exit(0);
