import { ORPCError } from "@orpc/server";
import { Effect } from "effect";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { getServerSession } from "@/lib/auth/session";
import { assertActiveSubscription } from "@/lib/billing/subscription";
import { createOAuthCode } from "@/lib/oauth/flows";
import { isRegisteredOAuthRedirect } from "@/lib/oauth/storage";
import { oauthConsentFormSchema } from "@/schemas/oauth";

function redirectWithParams(
  redirectUri: string,
  params: Record<string, string | undefined>
) {
  const url = new URL(redirectUri);
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const body = await request
    .formData()
    .then((formData) => Object.fromEntries(formData.entries()))
    .catch(() => ({}));
  const parsed = oauthConsentFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const requestHeaders = await headers();
  const session = await getServerSession({ headers: requestHeaders });
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isRegisteredRedirect = await isRegisteredOAuthRedirect(
    parsed.data.client_id,
    parsed.data.redirect_uri
  );

  if (!isRegisteredRedirect) {
    return NextResponse.json({ error: "invalid_client" }, { status: 400 });
  }

  if (parsed.data.decision === "deny") {
    return redirectWithParams(parsed.data.redirect_uri, {
      error: "access_denied",
      state: parsed.data.state,
    });
  }

  try {
    await assertOrganizationAccess({
      headers: requestHeaders,
      organizationId: parsed.data.organization_id,
      user: session.user,
    });
    await assertActiveSubscription(parsed.data.organization_id);
  } catch (error) {
    if (error instanceof ORPCError) {
      return redirectWithParams(parsed.data.redirect_uri, {
        error: "access_denied",
        error_description: error.message,
        state: parsed.data.state,
      });
    }
    throw error;
  }

  const result = await Effect.runPromise(
    createOAuthCode({
      clientId: parsed.data.client_id,
      redirectUri: parsed.data.redirect_uri,
      scope: parsed.data.scope,
      codeChallenge: parsed.data.code_challenge,
      resource: parsed.data.resource,
      userId: session.user.id,
      organizationId: parsed.data.organization_id,
    }).pipe(
      Effect.match({
        onFailure: (error) => error,
        onSuccess: (code) => code,
      })
    )
  );

  if (typeof result !== "string") {
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "Failed to create OAuth code",
      },
      { status: 500 }
    );
  }

  return redirectWithParams(parsed.data.redirect_uri, {
    code: result,
    state: parsed.data.state,
  });
}
