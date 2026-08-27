const DEFAULT_MAX_OLD_SPACE_MB = 6144;
const HEAP_FLAG_PATTERN = /(^|\s)--max[-_]old[-_]space[-_]size(=|\s|$)/;

function resolveHeapFlags(env = process.env) {
  const varName = env.ZENROUTE_MAX_OLD_SPACE_SIZE !== undefined
    ? "ZENROUTE_MAX_OLD_SPACE_SIZE"
    : env.NINEROUTER_MAX_OLD_SPACE_SIZE !== undefined
      ? "NINEROUTER_MAX_OLD_SPACE_SIZE"
      : null;

  if (varName) {
    const explicit = String(env[varName] ?? "").trim();
    if (explicit === "0") return [];
    const megabytes = Number(explicit);
    if (Number.isInteger(megabytes) && megabytes > 0) {
      return [`--max-old-space-size=${megabytes}`];
    }
    console.warn(
      `[zenroute] ignoring ${varName}="${explicit}": expected a positive integer (MB) or 0`,
    );
  }

  if (HEAP_FLAG_PATTERN.test(String(env.NODE_OPTIONS ?? ""))) return [];
  return [`--max-old-space-size=${DEFAULT_MAX_OLD_SPACE_MB}`];
}

module.exports = { resolveHeapFlags, DEFAULT_MAX_OLD_SPACE_MB };
