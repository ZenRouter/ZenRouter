const REFRESH_RESULT_TTL_MS = 10_000;
const MAX_DEDUP_CACHE_SIZE = 500;
const refreshDedupCache = new Map();

// Periodic sweep to clean up expired cache entries and prevent memory leaks
const sweepInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, val] of refreshDedupCache.entries()) {
    if (!val.promise && val.expiresAt && val.expiresAt <= now) {
      refreshDedupCache.delete(key);
    }
  }
}, 60_000);

if (sweepInterval.unref) sweepInterval.unref();

function evictOldestIfNeeded() {
  if (refreshDedupCache.size >= MAX_DEDUP_CACHE_SIZE) {
    const now = Date.now();
    // Try to evict expired entry first
    for (const [key, val] of refreshDedupCache.entries()) {
      if (!val.promise && val.expiresAt && val.expiresAt <= now) {
        refreshDedupCache.delete(key);
        if (refreshDedupCache.size < MAX_DEDUP_CACHE_SIZE) return;
      }
    }
    // Fall back to oldest inserted entry
    const oldestKey = refreshDedupCache.keys().next().value;
    if (oldestKey) refreshDedupCache.delete(oldestKey);
  }
}

// Match the policy fields consumed by proxyAwareFetch; keys stay in memory only.
export function getRefreshProxyKey(proxyOptions = null) {
  const normalize = (value) => typeof value === "string" ? value.trim() : "";
  return JSON.stringify([
    proxyOptions?.enabled === true || proxyOptions?.connectionProxyEnabled === true,
    normalize(proxyOptions?.url ?? proxyOptions?.connectionProxyUrl),
    normalize(proxyOptions?.noProxy ?? proxyOptions?.connectionNoProxy),
    proxyOptions?.strictProxy === true,
    normalize(proxyOptions?.vercelRelayUrl),
  ]);
}

export async function dedupRefresh(provider, oldToken, fn, log, proxyOptions = null) {
  if (!oldToken) return fn();
  const key = JSON.stringify([provider, oldToken, getRefreshProxyKey(proxyOptions)]);
  const hit = refreshDedupCache.get(key);
  if (hit) {
    if (hit.promise) {
      log?.info?.("TOKEN_REFRESH", `Reusing in-flight refresh for ${provider}`);
      return hit.promise;
    }
    if (hit.expiresAt > Date.now()) {
      log?.info?.("TOKEN_REFRESH", `Reusing recent refresh result for ${provider}`);
      return hit.result;
    }
    refreshDedupCache.delete(key);
  }

  evictOldestIfNeeded();

  const promise = (async () => {
    try {
      const result = await fn();
      refreshDedupCache.set(key, { result, expiresAt: Date.now() + REFRESH_RESULT_TTL_MS });
      return result;
    } catch (err) {
      refreshDedupCache.delete(key);
      throw err;
    }
  })();
  refreshDedupCache.set(key, { promise });
  return promise;
}
