#!/usr/bin/env node
// Single command to bump the project version everywhere it must stay in
// lockstep: the app (root package.json) and the published CLI launcher
// (cli/package.json). npm publish flows read these files directly.
//
// Usage:
//   node scripts/bump-version.mjs 0.5.57        # explicit version
//   node scripts/bump-version.mjs patch|minor|major
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url)) + "/..";
const files = [join(root, "package.json"), join(root, "cli/package.json")];

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: node scripts/bump-version.mjs <version|patch|minor|major>");
  process.exit(1);
}

function bump(version, level) {
  if (!["patch", "minor", "major"].includes(level)) return level;
  const parts = version.split(".").map(Number);
  if (level === "patch") parts[2] += 1;
  if (level === "minor") { parts[1] += 1; parts[2] = 0; }
  if (level === "major") { parts[0] += 1; parts[1] = 0; parts[2] = 0; }
  return parts.join(".");
}

let next = null;
for (const file of files) {
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  const target = next ?? bump(pkg.version, arg);
  if (!/^\d+\.\d+\.\d+$/.test(target)) {
    console.error(`Invalid version: ${target}`);
    process.exit(1);
  }
  pkg.version = target;
  writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`${file}: ${pkg.version}`);
  next = target;
}
console.log(`\nBumped both packages to v${next}. Rebuild when ready.`);
