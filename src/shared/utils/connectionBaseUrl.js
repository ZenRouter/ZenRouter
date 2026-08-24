export function withConnectionBaseUrl(providerSpecificData, baseUrl) {
  const merged = { ...(providerSpecificData || {}) };
  const trimmed = typeof baseUrl === "string" ? baseUrl.trim() : "";

  if (trimmed) merged.baseUrl = trimmed;
  else delete merged.baseUrl;

  return Object.keys(merged).length > 0 ? merged : undefined;
}