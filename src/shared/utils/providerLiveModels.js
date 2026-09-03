/**
 * Generic live model catalog fetcher for API-key providers.
 *
 * Most built-in providers already declare a public /models endpoint in their
 * registry entry (modelsFetcher.url, transport.validateUrl or transport.baseUrl),
 * so instead of writing one resolver per provider we derive the URL from the
 * registry and fetch it with the connection's API key. Results are cached in
 * memory briefly so /v1/models and the dashboard don't hammer upstream.
 */

import REGISTRY from "open-sse/providers/registry/index.js";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const TIMEOUT_MS = 5000;

const KNOWN_URL_SUFFIXES = ["/chat/completions", "/completions", "/messages"];

const cache = new Map(); // providerId -> { models, expiresAt }

/**
 * Derive the /models URL for a provider from its registry entry, or null when
 * no reliable URL can be found (callers then keep their static fallback).
 */
export function deriveModelsUrl(providerId) {
  const entry = REGISTRY.find((r) => r.id === providerId);
  if (!entry) return null;

  const fetcher = Array.isArray(entry.modelsFetcher)
    ? entry.modelsFetcher[0]
    : entry.modelsFetcher;
  if (fetcher?.url) return fetcher.url;

  const validateUrl = entry.transport?.validateUrl;
  if (validateUrl && /\/models(\?|$)/.test(validateUrl)) return validateUrl.split("?")[0];

  const baseUrl = entry.transport?.baseUrl;
  if (!baseUrl) return null;
  for (const suffix of KNOWN_URL_SUFFIXES) {
    if (baseUrl.endsWith(suffix)) return `${baseUrl.slice(0, -suffix.length)}/models`;
  }
  return null;
}

/**
 * Fetch the live model catalog for an API-key provider.
 * @returns {Promise<Array<{id: string, name?: string}>|null>} null on any failure
 */
export async function fetchProviderLiveModels(providerId, apiKey, { useCache = true } = {}) {
  if (!apiKey) return null;

  if (useCache) {
    const cached = cache.get(providerId);
    if (cached && Date.now() < cached.expiresAt) return cached.models;
  }

  const url = deriveModelsUrl(providerId);
  if (!url) return null;

  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(tid);
    if (!res.ok) return null;

    const data = await res.json();
    // OpenAI-style { data: [...] }, { models: [...] }, or a bare array.
    const raw = Array.isArray(data) ? data : (data?.data || data?.models || []);
    const models = raw
      .map((m) => {
        const id = m?.id || m?.name;
        const name = m?.name || m?.id;
        const contextWindow = Number(
          m?.context_length ?? m?.context_window ?? m?.max_context_tokens ?? m?.per_request_limits?.prompt_tokens
        );
        const maxOutput = Number(
          m?.max_completion_tokens ?? m?.max_tokens ?? m?.top_provider?.max_completion_tokens ?? m?.per_request_limits?.completion_tokens
        );
        const caps = {};
        if (Number.isFinite(contextWindow) && contextWindow > 0) caps.contextWindow = contextWindow;
        if (Number.isFinite(maxOutput) && maxOutput > 0) caps.maxOutput = maxOutput;
        return {
          id,
          name,
          ...(Object.keys(caps).length > 0 ? { capabilities: caps } : {}),
          ...(Number.isFinite(contextWindow) && contextWindow > 0 ? { context_length: contextWindow } : {}),
          ...(Number.isFinite(maxOutput) && maxOutput > 0 ? { max_completion_tokens: maxOutput } : {}),
        };
      })
      .filter((m) => typeof m.id === "string" && m.id.trim() !== "");

    if (!models.length) return null;
    cache.set(providerId, { models, expiresAt: Date.now() + CACHE_TTL_MS });
    return models;
  } catch {
    return null;
  }
}

export function clearProviderLiveModelsCache() {
  cache.clear();
}
