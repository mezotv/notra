import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  oauthConsentFormSchema,
  oauthConsentResponseSchema,
} from "@/schemas/oauth";

const INTERNAL_AUTH_ORIGIN = "http://notra.internal";
const OAUTH_CONSENT_PATH = "/api/auth/oauth2/consent";

async function parseConsentForm(request: Request) {
  return request
    .formData()
    .then((formData) => Object.fromEntries(formData.entries()))
    .catch(() => ({}));
}

function buildForwardedHeaders(source: Headers) {
  const forwarded = new Headers({
    accept: "application/json",
    "content-type": "application/json",
  });
  const forwardedHeaderNames = ["cookie", "origin", "referer"] as const;

  for (const name of forwardedHeaderNames) {
    const value = source.get(name);
    if (value) {
      forwarded.set(name, value);
    }
  }

  return forwarded;
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
      headers: buildForwardedHeaders(await headers()),
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
