import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button, buttonVariants } from "@/components/button";
import { getLastActiveOrganization, getSession } from "@/lib/auth/actions";
import { auth } from "@/lib/auth/server";
import { oauthSignedAuthorizeQuerySchema } from "@/schemas/oauth";
import {
  buildOAuthConsentPath,
  buildOAuthInternalAuthorizePath,
  buildOAuthQueryString,
  hasSignedOAuthQuery,
} from "@/utils/oauth";

export const metadata: Metadata = {
  title: "Authorize OAuth Client",
};

function getDisplayValue(value: string | string[] | undefined) {
  if (typeof value !== "string") {
    return undefined;
  }

  return value.length > 80 ? `${value.slice(0, 77)}...` : value;
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

  const organization = await getLastActiveOrganization();
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

  const client = await auth.api
    .getOAuthClientPublicPrelogin({
      body: {
        client_id: parsedQuery.data.client_id,
        oauth_query: oauthQuery,
      },
      headers: await headers(),
    })
    .catch(() => undefined);

  if (typeof client === "undefined") {
    return (
      <OAuthAuthorizeError
        clientId={getDisplayValue(parsedQuery.data.client_id)}
        description="Notra could not verify this authorization request. The link may be expired or the signed OAuth request may be invalid."
        title="Authorization request expired"
      />
    );
  }

  if (!client) {
    return (
      <OAuthAuthorizeError
        clientId={getDisplayValue(parsedQuery.data.client_id)}
        description="Notra could not find an OAuth client for this request. Register the client again, then restart the authorization flow."
        title="OAuth client not found"
      />
    );
  }

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
  const scope = getDisplayValue(resolvedSearchParams.scope);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
      <form
        action="/agent/auth/authorize/consent"
        className="space-y-6"
        method="post"
      >
        <div className="space-y-2">
          <h1 className="font-semibold text-2xl tracking-tight">
            Authorize {clientName}
          </h1>
          <p className="text-muted-foreground text-sm">
            This client is requesting access to your Notra account
            {organization ? ` for ${organization.slug}` : ""}.
          </p>
        </div>

        <input name="oauth_query" type="hidden" value={oauthQuery} />

        {scope ? (
          <p className="text-muted-foreground text-xs">Scopes: {scope}</p>
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
