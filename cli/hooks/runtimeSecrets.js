// Runtime secrets for the bundled server.
//
// The dashboard signs its session cookie with JWT_SECRET, and
// src/lib/auth/dashboardSession.js deliberately refuses to fall back to a
// default value (a known secret would let anyone forge a session). The
// published CLI package ships no .env, and the standalone server that the CLI
// spawns never loads one — Next only reads .env from its own project root,
// which inside the package is <pkg>/app/. So a fresh `npm i -g` install had no
// way to satisfy the requirement and every login failed with
// "JWT_SECRET environment variable is required".
//
// Generating the secret here is the correct fix: the CLI is the thing that owns
// the install, it must work without the user hand-editing files inside
// node_modules, and it must keep the secret stable across restarts so sessions
// survive (per-user, never a shared default).
//
// The secret lives in the user data dir next to the SQLite database
// (~/.zenrouter or %APPDATA%\zenrouter) — user-writable, survives upgrades.
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const SECRET_FILE = "secrets.json";
const MIN_SECRET_LENGTH = 32;

// The env object is a parameter (not read off process.env directly) so callers
// and tests can resolve the data dir explicitly without mutating global state.
function getDataDir(env = process.env) {
  if (env.DATA_DIR) return env.DATA_DIR;
  return process.platform === "win32"
    ? path.join(env.APPDATA || os.homedir(), "zenrouter")
    : path.join(os.homedir(), ".zenrouter");
}

function getSecretsPath(env = process.env) {
  return path.join(getDataDir(env), SECRET_FILE);
}

function readSecrets(env = process.env) {
  try {
    const raw = fs.readFileSync(getSecretsPath(env), "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    // Missing file on first run, or unreadable/corrupt: caller regenerates.
    return {};
  }
}

// Random, per-install, never a shared constant.
function generateSecret() {
  return crypto.randomBytes(32).toString("hex");
}

function isValidSecret(value) {
  return typeof value === "string" && value.trim().length >= MIN_SECRET_LENGTH;
}

// Write atomically (temp + rename) so a crash mid-write cannot leave a
// truncated file that would silently produce a new secret on next boot and
// invalidate every existing session.
function writeSecrets(secrets, env = process.env) {
  const target = getSecretsPath(env);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const tmp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(secrets, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, target);
}

/**
 * Ensure the runtime secrets exist, generating any that are missing.
 * Returns the resolved secret map (never throws for a missing file).
 * Existing values are preserved so sessions and MACHINE_ID_SALT stay stable.
 *
 * `env` is consulted first and always wins — an operator who exports
 * JWT_SECRET explicitly keeps full control.
 */
function ensureRuntimeSecrets(env = process.env, { silent = true } = {}) {
  const secrets = readSecrets(env);
  let changed = false;
  const resolved = {};

  const ensure = (key, envKeys) => {
    const fromEnv = envKeys.map((k) => env[k]).find(isValidSecret);
    if (fromEnv) {
      resolved[key] = fromEnv.trim();
      return;
    }
    if (isValidSecret(secrets[key])) {
      resolved[key] = secrets[key];
      return;
    }
    resolved[key] = generateSecret();
    secrets[key] = resolved[key];
    changed = true;
  };

  ensure("JWT_SECRET", ["JWT_SECRET"]);
  ensure("API_KEY_SECRET", ["API_KEY_SECRET"]);
  ensure("MACHINE_ID_SALT", ["MACHINE_ID_SALT"]);

  if (changed) {
    try {
      writeSecrets(secrets, env);
    } catch (e) {
      if (!silent) console.error(`⚠ Could not persist runtime secrets: ${e.message}`);
    }
  }

  return resolved;
}

// Secret values the spawned server must receive. Only returns keys the caller
// has not already provided, so an explicit env always stays authoritative.
function buildSecretsEnv(baseEnv = process.env) {
  const secrets = ensureRuntimeSecrets(baseEnv);
  const out = {};
  for (const [key, value] of Object.entries(secrets)) {
    if (!isValidSecret(baseEnv[key])) out[key] = value;
  }
  return out;
}

module.exports = {
  ensureRuntimeSecrets,
  buildSecretsEnv,
  getSecretsPath,
  getDataDir,
  generateSecret,
  isValidSecret,
};