import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { getSettings } from "@/lib/localDb";

const DEFAULT_PASSWORD = "12345678";

/**
 * The dashboard's auth-token signing key.
 *
 * JWT_SECRET is REQUIRED in all environments (≥ 32 chars). No fallback secret
 * is provided — every deployment must supply an explicit strong secret so that
 * container restarts do not silently invalidate sessions and so that the
 * secret does not default to a publicly known value.
 *
 * Rotation is supported via an optional old secret:
 *   - JWT_SECRET        — current primary secret (signs new tokens)
 *   - JWT_SECRET_OLD    — previous secret (verifies old tokens during rotation)
 *   Aliases for the old secret (for backwards compat): JWT_OLD_SECRET,
 *   JWT_SECRET_PREVIOUS. Only the primary is used for signing; verification
 *   tries each valid secret in order.
 *
 * Trim whitespace before validation so `"  secret\n"` is not silently accepted
 * as 32 chars of whitespace.
 */
export function loadJwtSecret(rawSecret = process.env.JWT_SECRET) {
  const secret = typeof rawSecret === "string" ? rawSecret.trim() : "";
  if (secret && secret.length >= 32) return secret;
  throw new Error(
    "JWT_SECRET environment variable is required. Set a strong random secret (min 32 chars) in your .env file."
  );
}

export function loadJwtOldSecret(
  rawOld = process.env.JWT_SECRET_OLD ?? process.env.JWT_OLD_SECRET ?? process.env.JWT_SECRET_PREVIOUS
) {
  const secret = typeof rawOld === "string" ? rawOld.trim() : "";
  if (secret && secret.length >= 32) return secret;
  return null;
}

function getPrimarySecret() {
  return new TextEncoder().encode(loadJwtSecret());
}

function getJwtSecrets() {
  const secrets = [getPrimarySecret()];
  const old = loadJwtOldSecret();
  if (old) {
    const primaryRaw = loadJwtSecret();
    if (old !== primaryRaw) {
      secrets.push(new TextEncoder().encode(old));
    }
  }
  return secrets;
}

export function shouldUseSecureCookie(request) {
  const forceSecureCookie = process.env.AUTH_COOKIE_SECURE === "true";
  const forwardedProto = request?.headers?.get?.("x-forwarded-proto");
  const isHttpsRequest = forwardedProto === "https";
  return forceSecureCookie || isHttpsRequest;
}

export async function createDashboardAuthToken(claims = {}) {
  return new SignJWT({ authenticated: true, ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getPrimarySecret());
}

export async function verifyDashboardAuthToken(token) {
  if (!token) return false;
  let secrets;
  try {
    secrets = getJwtSecrets();
  } catch {
    return false;
  }
  for (const sec of secrets) {
    try {
      await jwtVerify(token, sec);
      return true;
    } catch {}
  }
  return false;
}

export async function getDashboardAuthSession(token) {
  if (!token) return null;
  let secrets;
  try {
    secrets = getJwtSecrets();
  } catch {
    return null;
  }
  for (const sec of secrets) {
    try {
      const { payload } = await jwtVerify(token, sec);
      return payload;
    } catch {}
  }
  return null;
}

export async function setDashboardAuthCookie(cookieStore, request, claims = {}) {
  const token = await createDashboardAuthToken(claims);
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: shouldUseSecureCookie(request),
    sameSite: "lax",
    path: "/",
  });
}

export function clearDashboardAuthCookie(cookieStore) {
  cookieStore.delete("auth_token");
}

// Verify the current dashboard password (re-auth for sensitive actions).
export async function verifyDashboardPassword(password) {
  if (typeof password !== "string" || !password) return false;
  const settings = await getSettings();
  const storedHash = settings?.password;
  if (storedHash) return bcrypt.compare(password, storedHash);
  const raw = process.env.INITIAL_PASSWORD?.trim();
  const isPlaceholder = !raw || raw === "change-me" || raw === "change-me-to-a-long-random-secret" || raw === "change-me-to-a-long-random-secret-change-me-in-production-min-32-chars";
  const initialPassword = isPlaceholder ? DEFAULT_PASSWORD : raw;
  return password === initialPassword;
}
