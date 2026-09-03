import { ERROR_RULES, BACKOFF_CONFIG, TRANSIENT_COOLDOWN_MS, MAX_RATE_LIMIT_COOLDOWN_MS } from "../config/errorConfig.js";

/**
 * Calculate exponential backoff cooldown for rate limits (429)
 * Level 1: 1s, Level 2: 2s, Level 3: 4s... → max 4 min
 * @param {number} backoffLevel - Current backoff level
 * @returns {number} Cooldown in milliseconds
 */
export function getQuotaCooldown(backoffLevel = 0) {
  const level = Math.max(0, backoffLevel - 1);
  const cooldown = BACKOFF_CONFIG.base * Math.pow(2, level);
  return Math.min(cooldown, BACKOFF_CONFIG.max);
}

/**
 * Best-effort extraction of a precise rate-limit reset time from common
 * provider error shapes. Handles GLM/Z.AI "reset at" datetime, "retry in N"
 * relative phrases, and standard Retry-After header (seconds or HTTP-date).
 * Returns epoch ms or null.
 * Ported from PR #3612 (generic parser for provider-reported reset times).
 * @param {Response|null} response - Fetch response (for Retry-After header)
 * @param {string} message - Error message text
 * @returns {number|null} Epoch ms when rate limit resets, or null
 */
export function extractResetsAtMs(response, message) {
  if (!message) return null;
  const text = typeof message === "string" ? message : JSON.stringify(message);

  // GLM/Z.AI: "reset at 2026-08-17 02:56:15" (provider sends UTC without suffix)
  const resetAt = text.match(/reset at\s+(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/i);
  if (resetAt) {
    const ms = Date.parse(`${resetAt[1]}T${resetAt[2]}Z`);
    if (Number.isFinite(ms) && ms > Date.now()) return ms;
  }

  // "retry in 300 seconds" / "resets in 5 minutes" / "try again in 1 hour"
  const inTime = text.match(/(?:retry|try again|resets?)\s+(?:after|in)\s+(\d+(?:\.\d+)?)\s*(seconds?|minutes?|hours?)/i);
  if (inTime) {
    const n = Number(inTime[1]);
    const unit = inTime[2][0].toLowerCase();
    const mult = unit === "s" ? 1000 : unit === "m" ? 60000 : 3600000;
    const ms = Date.now() + n * mult;
    if (Number.isFinite(ms)) return ms;
  }

  // Retry-After header (seconds or HTTP-date) — PR #3612
  const ra = response?.headers?.get?.("retry-after") ?? response?.headers?.get?.("Retry-After");
  if (ra) {
    const secs = Number(ra);
    if (Number.isFinite(secs) && secs > 0) return Date.now() + secs * 1000;
    const dateMs = Date.parse(ra);
    if (Number.isFinite(dateMs) && dateMs > Date.now()) return dateMs;
  }

  return null;
}

/**
 * Parse Retry-After header value to epoch ms.
 * Separate helper for callers that only have the header string.
 * @param {string|number} retryAfter - Raw Retry-After header value
 * @returns {number|null} Epoch ms or null
 */
export function parseRetryAfter(retryAfter) {
  if (retryAfter == null) return null;
  const raw = String(retryAfter).trim();
  if (!raw) return null;
  const secs = Number(raw);
  if (Number.isFinite(secs) && secs > 0) return Date.now() + secs * 1000;
  const dateMs = Date.parse(raw);
  if (Number.isFinite(dateMs) && dateMs > Date.now()) return dateMs;
  return null;
}

/**
 * Check if error should trigger account fallback (switch to next account)
 * Config-driven: matches ERROR_RULES top-to-bottom (text rules first, then status)
 * @param {number} status - HTTP status code
 * @param {string} errorText - Error message text
 * @param {number} backoffLevel - Current backoff level for exponential backoff
 * @param {Response|null} [response] - Optional fetch Response for Retry-After header parsing (PR #3612)
 * @returns {{ shouldFallback: boolean, cooldownMs: number, newBackoffLevel?: number, resetsAtMs?: number }}
 */
export function checkFallbackError(status, errorText, backoffLevel = 0, response = null) {
  const lowerError = errorText
    ? (typeof errorText === "string" ? errorText : JSON.stringify(errorText)).toLowerCase()
    : "";

  // Provider-reported precise reset (429 + Retry-After or "reset at" pattern) — PR #3612
  if (status === 429) {
    const resetsAtMs = extractResetsAtMs(response, errorText);
    if (resetsAtMs) {
      const cooldownMs = Math.min(resetsAtMs - Date.now(), MAX_RATE_LIMIT_COOLDOWN_MS);
      if (cooldownMs > 0) {
        return { shouldFallback: true, cooldownMs, resetsAtMs };
      }
    }
  }

  for (const rule of ERROR_RULES) {
    // Text-based rule: match substring in error message
    if (rule.text && lowerError && lowerError.includes(rule.text)) {
      if (rule.backoff) {
        const newLevel = Math.min(backoffLevel + 1, BACKOFF_CONFIG.maxLevel);
        return { shouldFallback: true, cooldownMs: getQuotaCooldown(newLevel), newBackoffLevel: newLevel };
      }
      return { shouldFallback: true, cooldownMs: rule.cooldownMs };
    }

    // Status-based rule: match HTTP status code
    if (rule.status && rule.status === status) {
      if (rule.backoff) {
        const newLevel = Math.min(backoffLevel + 1, BACKOFF_CONFIG.maxLevel);
        return { shouldFallback: true, cooldownMs: getQuotaCooldown(newLevel), newBackoffLevel: newLevel };
      }
      return { shouldFallback: true, cooldownMs: rule.cooldownMs };
    }
  }

  // Default: transient cooldown for any unmatched error
  return { shouldFallback: true, cooldownMs: TRANSIENT_COOLDOWN_MS };
}

/**
 * Check if account is currently unavailable (cooldown not expired)
 */
export function isAccountUnavailable(unavailableUntil) {
  if (!unavailableUntil) return false;
  return new Date(unavailableUntil).getTime() > Date.now();
}

/**
 * Calculate unavailable until timestamp
 */
export function getUnavailableUntil(cooldownMs) {
  return new Date(Date.now() + cooldownMs).toISOString();
}

/**
 * Get the earliest rateLimitedUntil from a list of accounts
 * @param {Array} accounts - Array of account objects with rateLimitedUntil
 * @returns {string|null} Earliest rateLimitedUntil ISO string, or null
 */
export function getEarliestRateLimitedUntil(accounts) {
  let earliest = null;
  const now = Date.now();
  for (const acc of accounts) {
    if (!acc.rateLimitedUntil) continue;
    const until = new Date(acc.rateLimitedUntil).getTime();
    if (until <= now) continue;
    if (!earliest || until < earliest) earliest = until;
  }
  if (!earliest) return null;
  return new Date(earliest).toISOString();
}

/**
 * Format rateLimitedUntil to human-readable "reset after Xm Ys"
 * @param {string} rateLimitedUntil - ISO timestamp
 * @returns {string} e.g. "reset after 2m 30s"
 */
export function formatRetryAfter(rateLimitedUntil) {
  if (!rateLimitedUntil) return "";
  const diffMs = new Date(rateLimitedUntil).getTime() - Date.now();
  if (diffMs <= 0) return "reset after 0s";
  const totalSec = Math.ceil(diffMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return `reset after ${parts.join(" ")}`;
}

/** Prefix for model lock flat fields on connection record */
export const MODEL_LOCK_PREFIX = "modelLock_";

/** Special key used when no model is known (account-level lock) */
export const MODEL_LOCK_ALL = `${MODEL_LOCK_PREFIX}__all`;

/** Build the flat field key for a model lock */
export function getModelLockKey(model) {
  return model ? `${MODEL_LOCK_PREFIX}${model}` : MODEL_LOCK_ALL;
}

/**
 * Check if a model lock on a connection is still active.
 * Reads flat field `modelLock_${model}` (or `modelLock___all` when model=null).
 */
export function isModelLockActive(connection, model) {
  const now = Date.now();
  const stillLocked = (value) => {
    if (!value) return false;
    const until = new Date(value).getTime();
    return Number.isFinite(until) && until > now;
  };
  // Each key is judged on its own expiry. `a || b` picked the per-model key on the
  // truthiness of the string, so a stale one hid a still-active account-wide lock:
  // the connection then read as free for exactly the model that had just failed,
  // while still reading as locked for every other model. Nothing clears the stale
  // key either -- the lazy cleanup runs only after a successful request, and an
  // account under an `__all` lock never gets one. Same rule the sibling
  // `getEarliestModelLockUntil` already applies when it skips expired entries.
  return stillLocked(connection[getModelLockKey(model)]) || stillLocked(connection[MODEL_LOCK_ALL]);
}

/**
 * Get earliest active model lock expiry across all modelLock_* fields.
 * Used for UI cooldown display.
 */
export function getEarliestModelLockUntil(connection) {
  if (!connection) return null;
  let earliest = null;
  const now = Date.now();
  for (const [key, val] of Object.entries(connection)) {
    if (!key.startsWith(MODEL_LOCK_PREFIX) || !val) continue;
    const t = new Date(val).getTime();
    if (t <= now) continue;
    if (!earliest || t < earliest) earliest = t;
  }
  return earliest ? new Date(earliest).toISOString() : null;
}

/**
 * Build update object to set a model lock on a connection.
 */
export function buildModelLockUpdate(model, cooldownMs) {
  const key = getModelLockKey(model);
  return { [key]: new Date(Date.now() + cooldownMs).toISOString() };
}

/**
 * Build update object to clear all model locks on a connection.
 */
export function buildClearModelLocksUpdate(connection) {
  const cleared = {};
  for (const key of Object.keys(connection)) {
    if (key.startsWith(MODEL_LOCK_PREFIX)) cleared[key] = null;
  }
  return cleared;
}

/**
 * Filter available accounts (not in cooldown)
 */
export function filterAvailableAccounts(accounts, excludeId = null) {
  const now = Date.now();
  return accounts.filter(acc => {
    if (excludeId && acc.id === excludeId) return false;
    if (acc.rateLimitedUntil) {
      const until = new Date(acc.rateLimitedUntil).getTime();
      if (until > now) return false;
    }
    return true;
  });
}

/**
 * Reset account state when request succeeds
 * Clears cooldown and resets backoff level to 0
 * @param {object} account - Account object
 * @returns {object} Updated account with reset state
 */
export function resetAccountState(account) {
  if (!account) return account;
  return {
    ...account,
    rateLimitedUntil: null,
    backoffLevel: 0,
    lastError: null,
    status: "active"
  };
}

/**
 * Apply error state to account
 * @param {object} account - Account object
 * @param {number} status - HTTP status code
 * @param {string} errorText - Error message
 * @returns {object} Updated account with error state
 */
export function applyErrorState(account, status, errorText) {
  if (!account) return account;

  const backoffLevel = account.backoffLevel || 0;
  const { cooldownMs, newBackoffLevel } = checkFallbackError(status, errorText, backoffLevel);

  return {
    ...account,
    rateLimitedUntil: cooldownMs > 0 ? getUnavailableUntil(cooldownMs) : null,
    backoffLevel: newBackoffLevel ?? backoffLevel,
    lastError: { status, message: errorText, timestamp: new Date().toISOString() },
    status: "error"
  };
}
