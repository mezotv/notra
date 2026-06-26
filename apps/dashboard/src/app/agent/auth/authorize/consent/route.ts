import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  oauthConsentFormSchema,
  oauthConsentResponseSchema,
} from "@/schemas/oauth";

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

  const result = await auth.api
    .oauth2Consent({
      body: {
        accept: parsed.data.decision === "approve",
        oauth_query: parsed.data.oauth_query,
      },
      headers: await headers(),
    })
    .catch(() => {
      return null;
    });

  const body = oauthConsentResponseSchema.safeParse(result);
  if (!body.success) {
    return NextResponse.json(
      { error: "server_error", error_description: "Missing redirect URI" },
      { status: 500 }
    );
  }

  return NextResponse.redirect(body.data.redirect_uri, 303);
}
