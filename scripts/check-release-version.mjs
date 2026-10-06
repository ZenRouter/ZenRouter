import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export function checkReleaseVersion(root, tag) {
  const match = typeof tag === "string" && /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(tag);
  assert(match && match[0] === tag, "Invalid stable release tag; expected vMAJOR.MINOR.PATCH");
  const version = tag.slice(1);
  const read = path => JSON.parse(readFileSync(resolve(root, path), "utf8"));
  for (const prefix of ["", "cli/", "tests/", "gitbook/"]) {
    const manifest = read(prefix + "package.json");
    const lock = read(prefix + "package-lock.json");
    for (const [label, value] of [["manifest", manifest.version], ["lock", lock.version], ["lock root", lock.packages?.[""]?.version]]) {
      assert.equal(value, version, `Version mismatch: ${prefix || "root/"}${label}`);
    }
  }
  assert.equal(read("cli/package.json").name, "@joyccn/zenrouter", "Unexpected published CLI identity");
  return { tag, version };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const tag = process.argv[2] || `v${JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")).version}`;
  console.log(JSON.stringify(checkReleaseVersion(root, tag)));
}
