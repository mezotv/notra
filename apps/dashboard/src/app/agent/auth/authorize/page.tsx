import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/button";
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
    redirect(buildOAuthInternalAuthorizePath(resolvedSearchParams));
  }

  const client = await auth.api
    .getOAuthClientPublicPrelogin({
      body: {
        client_id: parsedQuery.data.client_id,
        oauth_query: oauthQuery,
      },
      headers: await headers(),
    })
    .catch(() => null);

  if (!client || client.disabled) {
    notFound();
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
