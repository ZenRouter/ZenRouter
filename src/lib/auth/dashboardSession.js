import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { getSettings } from "@/lib/localDb";

const DEFAULT_PASSWORD = "123456";

/**
 * The dashboard's auth-token signing key. Must come from the operator via env.
 *
 * Older versions auto-generated a random 32-byte secret on first boot and persisted
 * it under DATA_DIR/jwt-secret. That looks harmless but causes real outages:
 *
 *   - every fresh container restart invalidates every admin session;
 *   - the secret cannot be rotated without rewriting that file, which a routine
 *     config redeploy overwrites back to the old value;
 *   - a leaked secret (backup, dev box, CI cache) stays the active signer until
 *     somebody notices.
 *
 * `.env.example` already ships `JWT_SECRET=change-me-to-a-long-random-secret`,
 * so we just refuse to start until the operator has set one. We trim whitespace
 * to keep a quoted value like `"  secret\n"` from being treated as 32 chars of
 * whitespace; the minimum-length check catches every accidental placeholder.
 */
export function loadJwtSecret(rawSecret = process.env.JWT_SECRET) {
  const secret = typeof rawSecret === "string" ? rawSecret.trim() : "";
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET environment variable is required. Set a strong random secret (min 32 chars) in your .env file."
    );
  }
  return secret;
}

const SECRET = new TextEncoder().encode(loadJwtSecret());

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
    .sign(SECRET);
}

export async function verifyDashboardAuthToken(token) {
  if (!token) return false;
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function getDashboardAuthSession(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
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
  const initialPassword = process.env.INITIAL_PASSWORD || DEFAULT_PASSWORD;
  return password === initialPassword;
}
