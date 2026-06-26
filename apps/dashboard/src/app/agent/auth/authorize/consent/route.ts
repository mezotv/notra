import { NextResponse } from "next/server";
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

  const cookie = request.headers.get("cookie");
  const response = await fetch(
    new URL("/api/auth/oauth2/consent", request.url),
    {
      body: JSON.stringify({
        accept: parsed.data.decision === "approve",
        oauth_query: parsed.data.oauth_query,
      }),
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      method: "POST",
    }
  );

  if (!response.ok) {
    return new Response(response.body, {
      headers: response.headers,
      status: response.status,
    });
  }

  const body = oauthConsentResponseSchema.safeParse(await response.json());
  if (!body.success) {
    return NextResponse.json(
      { error: "server_error", error_description: "Missing redirect URI" },
      { status: 500 }
    );
  }

  return NextResponse.redirect(body.data.redirect_uri, 303);
}
