// Shared helpers for rtk filters (ported from rtk core::truncate / utils)

/** Truncate a single line to max chars, appending an ellipsis marker. */
export function truncateLine(line, max) {
  if (line.length <= max) return line;
  return line.slice(0, Math.max(0, max - 1)) + "…";
}
