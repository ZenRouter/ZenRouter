/**
 * Antigravity live quota cache — in-memory, refreshed on demand.
 * Used by auth.js pre-filter to skip accounts with exhausted model quota.
 * Also triggered by 409/429 error handler to sync exact resetAt from upstream.
 */

import { resolveConnectionProxyConfig } from "@/lib/network/connectionProxy";
import { getAntigravityUsage } from "open-sse/services/usage/google.js";
import * as log from "../utils/logger.js";

// In-memory cache: connectionId → { [modelId]: { remainingPercentage, resetAt } }
const quotaCache = new Map();
// Track last refresh per connection to avoid hammering
const lastRefreshAt = new Map();
// In-flight refresh promises — dedup concurrent 409/429 bursts
const inflightRefresh = new Map();

const MIN_REFRESH_INTERVAL_MS = 30_000; // 30s between refreshes per connection

/**
 * Get the quota cache (read-only reference for auth.js pre-filter).
 */
export function getAntigravityQuotaCache() {
  return quotaCache;
}

/**
 * Refresh quota for a single antigravity connection from upstream API.
 * Updates in-memory cache only. Cache expiry is the upstream model resetAt.
 * @returns {object|null} quotas map or null on failure
 */
export async function refreshAntigravityQuota(connectionId, accessToken, providerSpecificData) {
  const now = Date.now();
  // Coalesce concurrent refreshes before applying the interval gate.
  const inflight = inflightRefresh.get(connectionId);
  if (inflight) return inflight;

  const lastRefresh = lastRefreshAt.get(connectionId) || 0;
  if (now - lastRefresh < MIN_REFRESH_INTERVAL_MS) {
    log.debug("AG_QUOTA", `${connectionId.slice(0, 8)} | skip refresh (${Math.round((now - lastRefresh) / 1000)}s ago)`);
    return quotaCache.get(connectionId) || null;
  }

  // Record every attempt so failed quota calls cannot amplify an upstream 429 burst.
  lastRefreshAt.set(connectionId, now);
  const promise = _doRefresh(connectionId, accessToken, providerSpecificData, now);
  inflightRefresh.set(connectionId, promise);
  try {
    return await promise;
  } finally {
    inflightRefresh.delete(connectionId);
  }
}

async function _doRefresh(connectionId, accessToken, providerSpecificData, now) {
  try {
    const proxyCfg = await resolveConnectionProxyConfig(providerSpecificData || {});
    const proxyOptions = {
      connectionProxyEnabled: proxyCfg.connectionProxyEnabled === true,
      connectionProxyUrl: proxyCfg.connectionProxyUrl || "",
      connectionNoProxy: proxyCfg.connectionNoProxy || "",
      vercelRelayUrl: proxyCfg.vercelRelayUrl || "",
      strictProxy: proxyCfg.strictProxy === true,
    };

    const usage = await getAntigravityUsage(accessToken, providerSpecificData, proxyOptions);
    // 401/403 usage responses can contain an empty quotas object plus message.
    // Preserve known cache instead of replacing it with an upstream error response.
    if (!usage?.quotas || usage.message) return null;

    // Update in-memory cache. Caller logs CACHE_BLOCK only if requested model is exhausted.
    quotaCache.set(connectionId, usage.quotas);

    return usage.quotas;
  } catch (e) {
    log.warn("AG_QUOTA", `${connectionId.slice(0, 8)} | refresh failed: ${e.message}`);
    return null;
  }
}

// Strike-based fallback for when quota API lies (remaining >0 but generation still 429).
// See decolua/9router#3681 — Google's quota API can report 60-100% remaining while
// generation endpoints still 429 with "reset after 14s" hint, causing 300s blind
// lock storms across all accounts. Track consecutive 429s per connection+model
// where quota claims remaining >0; after N strikes treat as exhausted anyway.
const quotaStrikes = new Map(); // key -> { count, lastTime }
const STRIKE_THRESHOLD = 3;
const STRIKE_WINDOW_MS = 5 * 60 * 1000;

function recordStrike(connectionId, model) {
  const key = `${connectionId}:${model}`;
  const now = Date.now();
  const entry = quotaStrikes.get(key) || { count: 0, lastTime: 0 };
  if (now - entry.lastTime > STRIKE_WINDOW_MS) entry.count = 0;
  entry.count += 1;
  entry.lastTime = now;
  quotaStrikes.set(key, entry);
  return entry.count;
}

function clearStrikes(connectionId, model) {
  quotaStrikes.delete(`${connectionId}:${model}`);
}

/**
 * Handle Antigravity 409/429 — refresh RAM cache and return model resetAt when exhausted.
 * Called from chat handler error path.
 * @returns {number|null} resetAt timestamp ms (for resetsAtMs passthrough) or null
 */
export async function handleAntigravityQuotaError(connectionId, status, model, accessToken, providerSpecificData) {
  log.info("AG_QUOTA", `${connectionId.slice(0, 8)} | ${status} on ${model} — refreshing quota`);

  // Throttle applies to error paths too: one quota request per account/30s.
  // The first 409/429 populates cache; concurrent or repeated errors reuse it.
  const quota = (await refreshAntigravityQuota(connectionId, accessToken, providerSpecificData))?.[model];
  if (!quota || !quota.resetAt) return null;

  const resetMs = new Date(quota.resetAt).getTime();
  if (resetMs <= Date.now()) {
    clearStrikes(connectionId, model);
    return null;
  }

  // Honest 0% case — quota API correctly reports exhausted
  if (quota.remainingPercentage <= 0) {
    clearStrikes(connectionId, model);
    log.warn("AG_QUOTA", `${connectionId.slice(0, 8)} | UPSTREAM_${status} ${model} — quota exhausted; CACHE_BLOCK until ${quota.resetAt}`);
    return resetMs;
  }

  // Dishonest >0% case — quota claims remaining but we still got 429.
  // Use strike-based circuit breaker to avoid multi-day storm.
  const strikes = recordStrike(connectionId, model);
  if (strikes >= STRIKE_THRESHOLD) {
    log.warn("AG_QUOTA", `${connectionId.slice(0, 8)} | UPSTREAM_${status} ${model} — quota claims ${quota.remainingPercentage}% remaining but ${strikes} consecutive 429s; treating as exhausted until ${quota.resetAt}`);
    return resetMs;
  }
  log.info("AG_QUOTA", `${connectionId.slice(0, 8)} | quota claims ${quota.remainingPercentage}% remaining (strike ${strikes}/${STRIKE_THRESHOLD}) — not yet blocking`);
  return null;
}
