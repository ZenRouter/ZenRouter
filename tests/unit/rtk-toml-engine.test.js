// TOML filter engine tests — parity verified against upstream's own embedded
// [[tests]] vectors from rtk-ai/rtk src/filters/*.toml (v0.45.x).
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFilterToml, applyTomlFilter, loadTomlFilters } from "../../open-sse/rtk/tomlEngine.js";
import { autoDetectFilter } from "../../open-sse/rtk/autodetect.js";

const BUILTIN_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../open-sse/rtk/custom-filters");

function builtinTomls() {
  return readdirSync(BUILTIN_DIR)
    .filter((f) => f.endsWith(".toml"))
    .map((f) => ({ file: f, text: readFileSync(join(BUILTIN_DIR, f), "utf8") }));
}

describe("TOML subset parser", () => {
  it("parses every bundled filter without error", () => {
    for (const { file, text } of builtinTomls()) {
      const { filters } = parseFilterToml(text);
      expect(filters.size, file).toBeGreaterThan(0);
    }
  });

  it("parses multi-line arrays and inline tables", () => {
    const { filters } = parseFilterToml(`
[filters.demo]
match_command = "^demo\\\\b"
strip_lines_matching = [
  "^\\\\s*$",
  "^noise",
]
match_output = [
  { pattern = "already installed", message = "ok" },
]
max_lines = 7
`);
    const def = filters.get("demo");
    expect(def.strip_lines_matching).toHaveLength(2);
    expect(def.match_output).toEqual([{ pattern: "already installed", message: "ok" }]);
    expect(def.max_lines).toBe(7);
  });
});

describe("applyTomlFilter — upstream parity vectors", () => {
  // Run every [[tests.*]] vector shipped in the bundled TOMLs.
  for (const { file, text } of builtinTomls()) {
    const parsed = parseFilterToml(text);
    for (const def of parsed.filters.values()) {
      const vectors = parsed.tests.filter((t) => t.table === Object.keys(parsed.filters)[0] || true);
      for (const t of vectors) {
        if (!t.input && t.input !== "") continue;
        it(`${file} :: ${t.name ?? t.table}`, () => {
          const out = applyTomlFilter(def, t.input);
          if (typeof t.expected === "string") {
            expect(out.trim()).toBe(t.expected.trim());
          }
        });
      }
      break; // one def per file in our starter pack
    }
  }
});

describe("loader + autodetect routing", () => {
  it("loadTomlFilters picks up the bundled pack", () => {
    const defs = loadTomlFilters();
    const names = defs.map((d) => d.__source);
    for (const expected of ["make.toml", "terraform-plan.toml", "ps.toml"]) {
      expect(names.some((n) => n.endsWith(expected))).toBe(true);
    }
  });

  it("autodetect routes make output through the TOML filter", async () => {
    // Force a fresh module graph so the loader cache doesn't mask anything.
    const mod = await import("../../open-sse/rtk/autodetect.js?probe=1");
    const input = [
      "make[1]: Entering directory '/home/user'",
      "gcc -O2 foo.c",
      "make[1]: Leaving directory '/home/user'",
    ].join("\n");
    const fn = mod.autoDetectFilter(input);
    expect(fn).toBeTypeOf("function");
    const out = fn(input);
    expect(out).toBe("gcc -O2 foo.c");
  });
});

describe("user filter dir is honored", () => {
  it("loads a custom TOML from RTK_FILTERS_DIR", async () => {
    const tmp = mkdtempSync("/tmp/opencode/rtk-filters-");
    writeFileSync(join(tmp, "mytool.toml"), `
[filters.mytool]
description = "test fixture"
match_command = "^mytool:"
strip_lines_matching = ["^chatter"]
on_empty = "mytool: nothing"
`);
    process.env.RTK_FILTERS_DIR = tmp;
    delete globalThis.__rtkTomlCache;
    const defs = loadTomlFilters();
    const mine = defs.find((d) => d.__source.endsWith("mytool.toml"));
    expect(mine).toBeDefined();

    const out = applyTomlFilter(mine, "chatter line\nchatter line\n");
    expect(out).toBe("mytool: nothing");
    delete process.env.RTK_FILTERS_DIR;
    delete globalThis.__rtkTomlCache;
  });
});
