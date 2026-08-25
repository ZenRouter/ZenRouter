// Minimal TOML-subset parser + declarative filter engine, ported from
// rtk-ai/rtk src/filters/*.toml (v0.45.x). Supports exactly the constructs
// upstream filter files use:
//   [filters.name] / [[tests.name]] tables
//   key = "string" | """multi-line""" | true | false | integer
//   key = [ "regex", ... ]                     (single or multi-line)
//   key = [ { pattern = "...", replacement = "..." }, ... ]
// Full-line comments (# ...) are ignored.

function stripFullLineComment(line) {
  return line.trimStart().startsWith("#") ? "" : line;
}

/** Split a top-level comma list, respecting quotes, braces and brackets. */
function splitTopLevel(body) {
  const parts = [];
  let cur = "";
  let inStr = false;
  let strCh = null;
  let depth = 0;
  let escape = false;
  for (const ch of body) {
    if (inStr) {
      cur += ch;
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === strCh) inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'") { inStr = true; strCh = ch; cur += ch; continue; }
    if (ch === "{" || ch === "[") { depth++; cur += ch; continue; }
    if (ch === "}" || ch === "]") { depth--; cur += ch; continue; }
    if (ch === "," && depth === 0) { parts.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

function unescapeTomlString(raw) {
  return raw
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\");
}

function parseInlineTable(raw) {
  const obj = {};
  for (const part of splitTopLevel(raw.slice(1, -1))) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    let v = part.slice(eq + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) {
      v = unescapeTomlString(v.slice(1, -1));
    }
    obj[k] = v;
  }
  return obj;
}

function parseScalar(raw) {
  const t = raw.trim();
  if (t.startsWith("{") && t.endsWith("}")) return parseInlineTable(t);
  if (/^-?\d+$/.test(t)) return parseInt(t, 10);
  if (t === "true") return true;
  if (t === "false") return false;
  if (t.startsWith('"') && t.endsWith('"')) return unescapeTomlString(t.slice(1, -1));
  return t;
}

function closingOnSameLine(value) {
  let inStr = false;
  let escape = false;
  for (const ch of value) {
    if (inStr) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "]") return true;
  }
  return false;
}

/**
 * Parse a filter TOML document.
 * Returns { filters: Map<name, def>, tests: [{ table, name, input, expected }] }.
 */
export function parseFilterToml(text) {
  const filters = new Map();
  const tests = [];
  const lines = text.split("\n");

  let i = 0;
  let current = null; // active filters def object, or active test entry object

  while (i < lines.length) {
    const line = stripFullLineComment(lines[i]);
    i++;
    if (!line.trim()) continue;

    const tableMatch = /^\s*\[+([^\]]+)\]+\s*$/.exec(line);
    if (tableMatch) {
      const path = tableMatch[1].trim(); // filters.make | tests.make
      const dot = path.indexOf(".");
      const kind = path.slice(0, dot);
      const name = path.slice(dot + 1);
      if (kind === "filters") {
        if (!filters.has(name)) filters.set(name, {});
        current = { kind: "filter", target: filters.get(name) };
      } else if (kind === "tests") {
        const entry = {};
        tests.push({ table: name, ...entry, __entry: entry });
        current = { kind: "test", target: entry };
      } else {
        current = null;
      }
      continue;
    }
    if (!current) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    // Multi-line triple-quoted string
    if (value.startsWith('"""')) {
      const first = value.slice(3);
      const buf = [];
      if (first.endsWith('"""') && first.length >= 3) {
        buf.push(first.slice(0, -3));
      } else {
        buf.push(first);
        while (i < lines.length) {
          const l = lines[i]; i++;
          const idx = l.indexOf('"""');
          if (idx !== -1) { buf.push(l.slice(0, idx)); break; }
          buf.push(l);
        }
      }
      current.target[key] = unescapeTomlString(buf.join("\n").replace(/^\n/, ""));
      continue;
    }

    // Multi-line array
    if (value.startsWith("[") && !closingOnSameLine(value)) {
      const buf = [value];
      while (i < lines.length) {
        const l = stripFullLineComment(lines[i]); i++;
        buf.push(l);
        if (closingOnSameLine(l)) break;
      }
      value = buf.join("\n");
    }

    if (value.startsWith("[")) {
      const inner = value.slice(value.indexOf("[") + 1, value.lastIndexOf("]"));
      current.target[key] = splitTopLevel(inner).map(parseScalar);
    } else {
      current.target[key] = parseScalar(value);
    }
  }

  return {
    filters,
    tests: tests.map(({ table, __entry }) => ({ table, ...__entry })),
  };
}

// ==================== FILTER APPLICATION ====================

function compileRegexes(patterns) {
  return patterns.map((p) => {
    try { return new RegExp(p); } catch { return /$^/; } // never-match on bad regex
  });
}

/** Apply a parsed [filters.x] definition to raw output. */
export function applyTomlFilter(def, input) {
  let text = String(input ?? "");

  if (def.strip_ansi) {
    text = text.replace(/\x1B\[[0-9;]*[A-Za-z]/g, "");
  }

  // match_output short-circuits: pattern found anywhere → fixed message
  if (Array.isArray(def.match_output)) {
    for (const rule of def.match_output) {
      try {
        if (new RegExp(rule.pattern).test(text)) return rule.message;
      } catch { /* bad user regex — skip rule */ }
    }
  }

  let lines = text.split("\n");

  if (Array.isArray(def.keep_lines_matching) && def.keep_lines_matching.length > 0) {
    const res = compileRegexes(def.keep_lines_matching);
    lines = lines.filter((l) => res.some((re) => re.test(l)));
  } else if (Array.isArray(def.strip_lines_matching)) {
    const res = compileRegexes(def.strip_lines_matching);
    lines = lines.filter((l) => !res.some((re) => re.test(l)));
  }

  if (Array.isArray(def.replace)) {
    for (const sub of def.replace) {
      try {
        const re = new RegExp(sub.pattern, "g");
        lines = lines.map((l) => l.replace(re, sub.replacement));
      } catch { /* skip bad substitution */ }
    }
  }

  if (Number.isInteger(def.truncate_lines_at) && def.truncate_lines_at > 0) {
    lines = lines.map((l) => (l.length > def.truncate_lines_at ? l.slice(0, def.truncate_lines_at) : l));
  }

  let truncatedBy = 0;
  if (Number.isInteger(def.max_lines) && def.max_lines > 0 && lines.length > def.max_lines) {
    truncatedBy = lines.length - def.max_lines;
    lines = lines.slice(0, def.max_lines);
  }

  let out = lines.join("\n").replace(/^\n+/, "").replace(/\s+$/, "");

  if (out === "") {
    return def.on_empty != null ? def.on_empty : input; // never-worse
  }
  if (truncatedBy > 0) out += `\n… +${truncatedBy} more lines`;
  return out;
}

// ==================== LOADER ====================

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const BUILTIN_FILTER_DIR = join(dirname(fileURLToPath(import.meta.url)), "custom-filters");

function userFilterDirs() {
  const dirs = [];
  if (process.env.RTK_FILTERS_DIR) dirs.push(process.env.RTK_FILTERS_DIR);
  const dataDir = process.env.DATA_DIR; // absolute recommended (see CLAUDE.md)
  if (dataDir) dirs.push(join(dataDir, "rtk-filters"));
  return dirs;
}

/** Load every .toml from bundled + user dirs. Cached until files change on disk. */
export function loadTomlFilters() {
  const signature = [];
  const docs = [];

  const scan = (dir, source) => {
    let entries = [];
    try { entries = readdirSync(dir); } catch { return; }
    for (const f of entries.filter((e) => e.endsWith(".toml")).sort()) {
      const full = join(dir, f);
      try {
        signature.push(full + ":" + statSync(full).mtimeMs);
        docs.push({ source, file: f, text: readFileSync(full, "utf8") });
      } catch { /* unreadable — skip */ }
    }
  };

  scan(BUILTIN_FILTER_DIR, "builtin");
  for (const dir of userFilterDirs()) scan(dir, "user");

  const sig = signature.join("|");
  const cache = (globalThis.__rtkTomlCache ??= { sig: null, defs: [] });
  if (cache.sig === sig) return cache.defs;

  const defs = [];
  for (const doc of docs) {
    try {
      const parsed = parseFilterToml(doc.text);
      for (const [name, def] of parsed.filters) {
        def.__source = `${doc.source}:${doc.file}`;
        defs.push(def);
      }
    } catch (e) {
      console.warn(`[RTK] Failed to parse filter ${doc.source}/${doc.file}:`, e.message);
    }
  }
  cache.sig = sig;
  cache.defs = defs;
  return defs;
}
