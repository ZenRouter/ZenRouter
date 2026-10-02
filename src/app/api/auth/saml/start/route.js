import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSettings } from "@/lib/localDb";
import { buildSamlAuthorizeUrl, getSamlBaseUrl, isSamlConfigured, SAML_STATE_MAX_AGE_SECONDS } from "@/lib/auth/saml.js";
import { shouldUseSecureCookie } from "@/lib/auth/dashboardSession";

export async function GET(request) {
  const settings = await getSettings();
  const origin = getSamlBaseUrl(request, settings);
  try {
    if (!isSamlConfigured(settings)) {
      return NextResponse.redirect(new URL("/login?error=saml_not_configured", origin));
    }

    const { authorizeUrl, requestId } = await buildSamlAuthorizeUrl(request, settings);

    const cookieStore = await cookies();
    // Cross-site IdP POST callbacks require SameSite=None and Secure. HTTP-only
    // development remains Lax; cross-site SAML deployments must use HTTPS.
    const secure = new URL(origin).protocol === "https:" || shouldUseSecureCookie(request);
    cookieStore.set("saml_state", requestId, {
      httpOnly: true,
      secure,
      sameSite: secure ? "none" : "lax",
      path: "/",
      maxAge: SAML_STATE_MAX_AGE_SECONDS,
    });

    return NextResponse.redirect(authorizeUrl);
  } catch (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message || "saml_start_failed")}`, origin)
    );
  }
}
