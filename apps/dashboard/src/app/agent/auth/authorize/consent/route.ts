import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  oauthConsentFormSchema,
  oauthConsentResponseSchema,
  oauthSignedAuthorizeQuerySchema,
} from "@/schemas/oauth";
import { buildOAuthForwardedHeaders } from "@/utils/oauth-proxy";

const INTERNAL_AUTH_ORIGIN = "http://notra.internal";
const OAUTH_CONSENT_PATH = "/api/auth/oauth2/consent";
const SCOPE_SEPARATOR_REGEX = /\s+/;

async function parseConsentForm(request: Request) {
  return request
    .formData()
    .then((formData) => Object.fromEntries(formData.entries()))
    .catch(() => ({}));
}

function parseScopeSet(scope: string | undefined) {
  return new Set(scope?.split(SCOPE_SEPARATOR_REGEX).filter(Boolean) ?? []);
}

function isScopeSubset(selected: Set<string>, requested: Set<string>) {
  for (const scope of selected) {
    if (!requested.has(scope)) {
      return false;
    }
  }

  return true;
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

  if (parsed.data.decision === "approve") {
    const oauthQuery = oauthSignedAuthorizeQuerySchema.parse(
      Object.fromEntries(new URLSearchParams(parsed.data.oauth_query).entries())
    );
    const requestedScopes = parseScopeSet(oauthQuery.scope);
    const selectedScopes = parseScopeSet(parsed.data.scope);

    if (requestedScopes.size > 0 && selectedScopes.size === 0) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "At least one permission must be selected",
        },
        { status: 400 }
      );
    }

    if (!isScopeSubset(selectedScopes, requestedScopes)) {
      return NextResponse.json(
        {
          error: "invalid_scope",
          error_description: "Granted scopes must be part of the request",
        },
        { status: 400 }
      );
    }

    if (!parsed.data.organization_id) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "Organization selection is required",
        },
        { status: 400 }
      );
    }

    try {
      await auth.api.setActiveOrganization({
        body: { organizationId: parsed.data.organization_id },
        headers: request.headers,
      });
    } catch {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "Invalid organization selection",
        },
        { status: 400 }
      );
    }
  }

  const isApproved = parsed.data.decision === "approve";

  const response = await auth.handler(
    new Request(new URL(OAUTH_CONSENT_PATH, INTERNAL_AUTH_ORIGIN), {
      body: JSON.stringify({
        accept: isApproved,
        oauth_query: parsed.data.oauth_query,
        ...(isApproved && parsed.data.scope
          ? { scope: parsed.data.scope }
          : {}),
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
