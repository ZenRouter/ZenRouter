// OAuth callback routing policy.
//
// Some upstream OAuth clients accept an arbitrary HTTPS callback and can return
// directly to the public ZenRouter origin. Others are installed-app clients
// whose upstream registration permits loopback only; changing those to a
// custom domain would fail with redirect_uri_mismatch. Keep that distinction
// explicit instead of assuming every provider behaves the same.

const PUBLIC_CALLBACK_PROVIDERS = new Set([
  "claude",
  "cline",
  "clinepass",
  "gitlab",
  "iflow",
  "kimchi",
]);

const FIXED_LOOPBACK_CALLBACKS = {
  codex: "http://localhost:1455/auth/callback",
  xai: "http://127.0.0.1:56121/callback",
};

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function isLoopbackOAuthOrigin(origin) {
  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    return LOOPBACK_HOSTS.has(host);
  } catch {
    return false;
  }
}

export function supportsPublicOAuthCallback(provider) {
  return PUBLIC_CALLBACK_PROVIDERS.has(String(provider || "").toLowerCase());
}

export function resolveOAuthRedirectUri(provider, currentOrigin) {
  const id = String(provider || "").toLowerCase();
  if (FIXED_LOOPBACK_CALLBACKS[id]) return FIXED_LOOPBACK_CALLBACKS[id];

  let origin;
  try {
    origin = new URL(currentOrigin);
  } catch {
    return "http://localhost:8080/callback";
  }

  if (!isLoopbackOAuthOrigin(origin.origin) && supportsPublicOAuthCallback(id)) {
    return new URL("/callback", origin.origin).toString();
  }

  // Installed-app OAuth clients (notably Google/Antigravity/Gemini CLI)
  // generally whitelist loopback and reject arbitrary public domains.
  const port = origin.port || (origin.protocol === "https:" ? "443" : "80");
  return `http://localhost:${port}/callback`;
}

// postMessage receiver guard. Strict URL parsing avoids substring mistakes
// such as trusting https://localhost.attacker.example.
export function isTrustedOAuthMessageOrigin(currentOrigin, eventOrigin) {
  if (eventOrigin === currentOrigin) return true;
  try {
    const eventUrl = new URL(eventOrigin);
    const host = eventUrl.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    return (
      (eventUrl.protocol === "http:" || eventUrl.protocol === "https:")
      && LOOPBACK_HOSTS.has(host)
    );
  } catch {
    return false;
  }
}
