// Port of rtk src/cmds/system/json_cmd.rs compact_json (v0.45.x, default depth 5)
// Inspects JSON structure without dumping every value.
const MAX_DEPTH = 5;
const MAX_KEYS_SHOWN = 20;
const STRING_PREVIEW = 80;
const ARRAY_INLINE_MAX = 5;

function truncateStr(s, max = 77) {
  if (s.length <= max) return s;
  return s.slice(0, max) + "...";
}

function isSimple(v) {
  return v === null || ["boolean", "number", "string"].includes(typeof v);
}

export function jsonCompact(value, depth = 0, maxDepth = MAX_DEPTH) {
  const indent = "  ".repeat(depth);

  if (depth > maxDepth) return `${indent}...`;

  if (value === null) return `${indent}null`;
  if (typeof value === "boolean") return `${indent}${value}`;
  if (typeof value === "number") return `${indent}${value}`;
  if (typeof value === "string") {
    const out = truncateStr(value);
    return `${indent}"${out}"`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return `${indent}[]`;
    if (value.length > ARRAY_INLINE_MAX) {
      const first = jsonCompact(value[0], depth + 1, maxDepth);
      return `${indent}[${first.trim()}, ... +${value.length - 1} more]`;
    }
    const items = value.map((v) => jsonCompact(v, depth + 1, maxDepth));
    const allSimple = value.every(isSimple);
    if (allSimple) {
      return `${indent}[${items.map((s) => s.trim()).join(", ")}]`;
    }
    const lines = [`${indent}[`];
    for (const item of items) lines.push(`${item},`);
    lines.push(`${indent}]`);
    return lines.join("\n");
  }

  // Plain object
  const keys = Object.keys(value);
  if (keys.length === 0) return `${indent}{}`;
  const lines = [`${indent}{`];
  const sorted = [...keys].sort();
  for (let i = 0; i < sorted.length; i++) {
    const key = sorted[i];
    const val = value[key];
    if (isSimple(val)) {
      lines.push(`${indent}  ${key}: ${jsonCompact(val, 0, maxDepth).trim()}`);
    } else {
      lines.push(`${indent}  ${key}:`);
      lines.push(jsonCompact(val, depth + 1, maxDepth));
    }
    if (i >= MAX_KEYS_SHOWN) {
      lines.push(`${indent}  ... +${sorted.length - i - 1} more keys`);
      break;
    }
  }
  lines.push(`${indent}}`);
  return lines.join("\n");
}

/**
 * Entry point for post-hoc tool_result compression: parse then compact.
 * Returns null when the input is not JSON so callers fall back untouched.
 */
export function jsonFilter(text) {
  try {
    const parsed = JSON.parse(text);
    return jsonCompact(parsed);
  } catch {
    return null;
  }
}
