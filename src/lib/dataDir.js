import fs from "node:fs";
import path from "path";
import os from "os";

const APP_NAME = "zenroute";
const LEGACY_APP_NAME = "zenroute";

function defaultDir() {
  if (process.platform === "win32") {
    const base = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    const zenPath = path.join(base, APP_NAME);
    const legacyPath = path.join(base, LEGACY_APP_NAME);
    if (!fs.existsSync(zenPath) && fs.existsSync(legacyPath)) {
      return legacyPath;
    }
    return zenPath;
  }
  const zenPath = path.join(os.homedir(), `.${APP_NAME}`);
  const legacyPath = path.join(os.homedir(), `.${LEGACY_APP_NAME}`);
  if (!fs.existsSync(zenPath) && fs.existsSync(legacyPath)) {
    return legacyPath;
  }
  return zenPath;
}

export function getDataDir() {
  const configured = process.env.DATA_DIR;
  if (!configured) return defaultDir();

  // On Windows, ignore Unix-style absolute paths (e.g. /var/lib/...) that come
  // from a Linux-targeted .env or Docker config — they are not valid here.
  if (process.platform === "win32" && /^\//.test(configured)) {
    console.warn(`[DATA_DIR] '${configured}' is a Unix path on Windows → fallback to default`);
    return defaultDir();
  }

  try {
    fs.mkdirSync(configured, { recursive: true });
    return configured;
  } catch (e) {
    if (e?.code === "EACCES" || e?.code === "EPERM") {
      console.warn(`[DATA_DIR] '${configured}' not writable → fallback ~/.${APP_NAME}`);
      return defaultDir();
    }
    throw e;
  }
}

export const DATA_DIR = getDataDir();
