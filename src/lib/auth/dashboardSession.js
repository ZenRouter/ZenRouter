import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { getSettings } from "@/lib/localDb";

const DEFAULT_PASSWORD = "12345678";

/**
 * The dashboard's auth-token signing key.
 *
 * Production requires an operator-supplied JWT_SECRET (≥ 32 chars) so that
 * every container restart uses the same secret — otherwise sessions would
 * silently invalidate on redeploy. `.env.example` already ships a placeholder.
 *
 * For local dev / tests / build-only contexts we fall back to a clearly
 * insecure deterministic string so `npm run dev`, `npm run build`, and the
 * vitest suite can run without an extra export step. Production never reaches
 * this fallback:
 *   - `NODE_ENV=production` (the runtime value `next start` and Next.js prod
 *     build set) → strict, throws without a real secret;
 *   - `NODE_ENV=test` → strict too, tests should always pass an explicit
 *     `loadJwtSecret(...)` argument or set the env themselves;
 *   - everything else (development, production-build phase, CI) → fallback so
 *     `npm run build` and `npm run dev` keep working out of the box.
 *
 * Trim whitespace before validation so `"  secret\n"` is not silently accepted
 * as 32 chars of whitespace, and the minimum-length check catches every
 * accidental placeholder.
 */
const DEV_FALLBACK_SECRET = "dev-only-insecure-jwt-secret-do-not-use-in-production";

export function loadJwtSecret(rawSecret = process.env.JWT_SECRET) {
  const secret = typeof rawSecret === "string" ? rawSecret.trim() : "";
  if (secret && secret.length >= 32) return secret;

  // "production" covers:
  //   - NODE_ENV=production explicit (npm start, deployment envs)
  //   - phase-production-build / phase-export / phase-static (Next.js sets these
  //     during `npm run build` while producing the standalone bundle — never
  //     seen at runtime by end users, so safe to skip the fallback)
  // For runtime safety we only honour the runtime NODE_ENV here; the build
  // phase is allowed the fallback so the bundle can be produced without an
  // injected secret.
  const phase = process.env.NODE_ENV || "";
  const isBuildPhase = (process.env.NEXT_PHASE || "").startsWith("phase-");
  if (phase === "production" && !isBuildPhase) {
    throw new Error(
      "JWT_SECRET environment variable is required. Set a strong random secret (min 32 chars) in your .env file."
    );
  }
  if (phase === "test") {
    throw new Error(
      "JWT_SECRET environment variable is required. Set a strong random secret (min 32 chars) in your .env file."
    );
  }

  // dev / build-only fallback. Loud warning so the operator still notices.
  if (!globalThis.__jwtDevFallbackWarned) {
    console.warn(
      "[jwt] JWT_SECRET not set; using insecure development fallback. " +
        "Set JWT_SECRET in your .env before deploying."
    );
    globalThis.__jwtDevFallbackWarned = true;
  }
  return DEV_FALLBACK_SECRET;
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
  const raw = process.env.INITIAL_PASSWORD?.trim();
  const isPlaceholder = !raw || raw === "change-me" || raw === "change-me-to-a-long-random-secret" || raw === "change-me-to-a-long-random-secret-change-me-in-production-min-32-chars";
  const initialPassword = isPlaceholder ? DEFAULT_PASSWORD : raw;
  return password === initialPassword;
}
