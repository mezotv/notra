import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button, buttonVariants } from "@/components/button";
import { OAuthClientLogo } from "@/components/oauth/oauth-client-logo";
import { getConsentOrganizations, getSession } from "@/lib/auth/actions";
import { auth } from "@/lib/auth/server";
import { resolveOAuthClientBrandId } from "@/lib/oauth/clients";
import { buildScopeGroups } from "@/lib/oauth/scopes";
import { oauthSignedAuthorizeQuerySchema } from "@/schemas/oauth";
import {
  buildOAuthConsentPath,
  buildOAuthInternalAuthorizePath,
  buildOAuthQueryString,
  hasSignedOAuthQuery,
} from "@/utils/oauth";
import { OAuthQueryInput } from "./oauth-query-input";
import { OAuthOrgSelector } from "./org-selector";
import { OAuthScopeSelector } from "./scope-selector";

export const metadata: Metadata = {
  title: "Authorize OAuth Client",
};

function getDisplayValue(value: string | string[] | undefined) {
  if (typeof value !== "string") {
    return undefined;
  }

  return value.length > 80 ? `${value.slice(0, 77)}...` : value;
}

function isExpiredOAuthQuery(exp: number) {
  return exp * 1000 < Date.now();
}

function getOAuthClientLookupError(error: unknown) {
  if (!(error instanceof Error)) {
    return "unknown";
  }

  const status =
    "status" in error && typeof error.status === "number"
      ? error.status
      : undefined;
  const body =
    "body" in error && error.body && typeof error.body === "object"
      ? error.body
      : undefined;
  const errorCode =
    body && "error" in body && typeof body.error === "string"
      ? body.error
      : undefined;

  if (status === 404 || error.message === "client not found") {
    return "not-found";
  }

  if (status === 400 || status === 401 || errorCode === "invalid_signature") {
    return "invalid-request";
  }

  return "unknown";
}

function OAuthAuthorizeError({
  clientId,
  description,
  title,
}: {
  clientId?: string;
  description: string;
  title: string;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>

        {clientId ? (
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-muted-foreground text-xs">
            client_id: {clientId}
          </p>
        ) : null}

        <Link
          className={buttonVariants({
            className: "w-full",
            variant: "outline",
          })}
          href="/dashboard"
        >
          Back to Notra
        </Link>
      </div>
    </div>
  );
}

export default async function OAuthAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;

  if (!hasSignedOAuthQuery(resolvedSearchParams)) {
    redirect(buildOAuthInternalAuthorizePath(resolvedSearchParams));
  }

  const session = await getSession();
  if (!session?.user) {
    redirect(
      `/login?returnTo=${encodeURIComponent(buildOAuthConsentPath(resolvedSearchParams))}`
    );
  }

  const { organizations, activeOrganizationId } =
    await getConsentOrganizations();
  const oauthQuery = buildOAuthQueryString(resolvedSearchParams);
  const parsedQuery = oauthSignedAuthorizeQuerySchema.safeParse(
    Object.fromEntries(new URLSearchParams(oauthQuery).entries())
  );

  if (!parsedQuery.success) {
    return (
      <OAuthAuthorizeError
        description="The authorization request is missing required OAuth parameters or includes unsupported scopes."
        title="Invalid authorization request"
      />
    );
  }

  if (isExpiredOAuthQuery(parsedQuery.data.exp)) {
    return (
      <OAuthAuthorizeError
        clientId={getDisplayValue(parsedQuery.data.client_id)}
        description="This authorization link has expired. Restart the OAuth flow from the client to generate a fresh authorization request."
        title="Authorization request expired"
      />
    );
  }

  const clientResult = await auth.api
    .getOAuthClientPublicPrelogin({
      body: {
        client_id: parsedQuery.data.client_id,
        oauth_query: oauthQuery,
      },
      headers: await headers(),
    })
    .then((client) => ({ client, error: null }))
    .catch((error) => ({
      client: null,
      error: getOAuthClientLookupError(error),
    }));

  if (!clientResult.client) {
    if (clientResult.error === "invalid-request") {
      return (
        <OAuthAuthorizeError
          clientId={getDisplayValue(parsedQuery.data.client_id)}
          description="Notra could not verify this authorization request. Restart the OAuth flow from the client to generate a fresh signed request."
          title="Invalid authorization request"
        />
      );
    }

    return (
      <OAuthAuthorizeError
        clientId={getDisplayValue(parsedQuery.data.client_id)}
        description="Notra could not find an OAuth client for this request. Register the client again, then restart the authorization flow."
        title="OAuth client not found"
      />
    );
  }

  const client = clientResult.client;

  if (client.disabled) {
    return (
      <OAuthAuthorizeError
        clientId={getDisplayValue(client.client_id)}
        description="This OAuth client is disabled and cannot request access to your Notra account."
        title="OAuth client disabled"
      />
    );
  }

  const clientName =
    getDisplayValue(client.client_name) ??
    getDisplayValue(client.client_uri) ??
    getDisplayValue(client.client_id);

  const requestedScope = parsedQuery.data.scope ?? "";
  const scopeGroups = buildScopeGroups(
    requestedScope ? requestedScope.split(" ") : []
  );
  const brandId = resolveOAuthClientBrandId({
    client_id: client.client_id,
    client_name: client.client_name,
    client_uri: client.client_uri,
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
      <form
        action="/agent/auth/authorize/consent"
        className="space-y-6"
        method="post"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <OAuthClientLogo
              brandId={brandId}
              name={clientName ?? "OAuth client"}
            />
            <h1 className="font-semibold text-2xl tracking-tight">
              Authorize {clientName}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            This client is requesting access to your Notra account.
          </p>
        </div>

        <OAuthQueryInput />

        <OAuthOrgSelector
          initialOrganizationId={activeOrganizationId}
          organizations={organizations}
        />

        {scopeGroups.length ? (
          <OAuthScopeSelector
            defaultGrant={requestedScope}
            groups={scopeGroups}
          />
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Button name="decision" type="submit" value="approve">
            Authorize
          </Button>
          <Button name="decision" type="submit" value="deny" variant="outline">
            Deny
          </Button>
        </div>
      </form>
    </div>
  );
}
