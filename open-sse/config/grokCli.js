// Non-version config for the Grok CLI (cli-chat-proxy.grok.com) provider.
// User-Agent, client version, and client identifier are single-sourced from
// open-sse/config/clientVersions.js so a bump there propagates everywhere.

export const GROK_CLI_MODEL = "grok-build";
export const GROK_CLI_BASE_URL = "https://cli-chat-proxy.grok.com/v1";

export function supportsGrokCliReasoningEffort(model) {
  // ponytail: unknown models omit effort until live metadata reaches dispatch.
  return /^grok-4\.(?:5|6)(?:$|-)/.test(String(model || ""));
}
