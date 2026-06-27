import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  oauthConsentFormSchema,
  oauthConsentResponseSchema,
} from "@/schemas/oauth";
import { buildOAuthForwardedHeaders } from "@/utils/oauth-proxy";

const INTERNAL_AUTH_ORIGIN = "http://notra.internal";
const OAUTH_CONSENT_PATH = "/api/auth/oauth2/consent";

async function parseConsentForm(request: Request) {
  return request
    .formData()
    .then((formData) => Object.fromEntries(formData.entries()))
    .catch(() => ({}));
}

export async function POST(request: Request) {
  const parsed = oauthConsentFormSchema.safeParse(
    await parseConsentForm(request)
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const response = await auth.handler(
    new Request(new URL(OAUTH_CONSENT_PATH, INTERNAL_AUTH_ORIGIN), {
      body: JSON.stringify({
        accept: parsed.data.decision === "approve",
        oauth_query: parsed.data.oauth_query,
      }),
      headers: buildOAuthForwardedHeaders(request.headers, {
        accept: "application/json",
        "content-type": "application/json",
      }),
      method: "POST",
    })
  );
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      result ?? {
        error: "server_error",
        error_description: "OAuth consent failed",
      },
      { status: response.status }
    );
  }

  const body = oauthConsentResponseSchema.safeParse(result);
  if (!body.success) {
    return NextResponse.json(
      { error: "server_error", error_description: "Missing redirect URI" },
      { status: 500 }
    );
  }

  return NextResponse.redirect(body.data.redirect_uri, 303);
}
