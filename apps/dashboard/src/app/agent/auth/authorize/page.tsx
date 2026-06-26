import { db } from "@notra/db/drizzle";
import { organizations } from "@notra/db/schema";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { inArray } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/button";
import { getAllUserOrganizations, getSession } from "@/lib/auth/actions";
import { oauthAuthorizeSearchParamsSchema } from "@/schemas/oauth";
import {
  buildOAuthAuthorizePath,
  getOAuthClientDisplayName,
  getOAuthResourceDisplayName,
} from "@/utils/oauth";

export const metadata: Metadata = {
  title: "Authorize OAuth Client",
};

export default async function OAuthAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawSearchParams = await searchParams;
  const parsed = oauthAuthorizeSearchParamsSchema.safeParse({
    response_type: rawSearchParams.response_type,
    client_id: rawSearchParams.client_id,
    redirect_uri: rawSearchParams.redirect_uri,
    scope: rawSearchParams.scope,
    state: rawSearchParams.state,
    code_challenge: rawSearchParams.code_challenge,
    code_challenge_method: rawSearchParams.code_challenge_method,
    resource: rawSearchParams.resource,
  });

  if (!parsed.success) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
        <h1 className="font-semibold text-2xl tracking-tight">
          Invalid OAuth request
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          The client sent an invalid authorization request. Start the login flow
          again from your CLI or MCP client.
        </p>
      </div>
    );
  }

  const session = await getSession();
  if (!session?.user) {
    redirect(
      `/login?returnTo=${encodeURIComponent(
        buildOAuthAuthorizePath({
          responseType: parsed.data.response_type,
          clientId: parsed.data.client_id,
          redirectUri: parsed.data.redirect_uri,
          scope: parsed.data.scope,
          state: parsed.data.state,
          codeChallenge: parsed.data.code_challenge,
          codeChallengeMethod: parsed.data.code_challenge_method,
          resource: parsed.data.resource,
        })
      )}`
    );
  }

  const memberships = await getAllUserOrganizations();
  const orgRows =
    memberships.length > 0
      ? await db.query.organizations.findMany({
          where: inArray(
            organizations.id,
            memberships.map((membership) => membership.id)
          ),
          columns: { id: true, name: true, slug: true, logo: true },
        })
      : [];

  const clientName = getOAuthClientDisplayName(parsed.data.client_id);
  const resourceName = getOAuthResourceDisplayName(parsed.data.resource);

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
            Pick the organization this client can access through {resourceName}.
          </p>
        </div>

        <input name="response_type" type="hidden" value="code" />
        <input name="client_id" type="hidden" value={parsed.data.client_id} />
        <input
          name="redirect_uri"
          type="hidden"
          value={parsed.data.redirect_uri}
        />
        <input name="scope" type="hidden" value={parsed.data.scope} />
        <input
          name="code_challenge"
          type="hidden"
          value={parsed.data.code_challenge}
        />
        <input name="code_challenge_method" type="hidden" value="S256" />
        <input name="resource" type="hidden" value={parsed.data.resource} />
        {parsed.data.state ? (
          <input name="state" type="hidden" value={parsed.data.state} />
        ) : null}

        {orgRows.length > 0 ? (
          <fieldset className="grid gap-2">
            <legend className="font-medium text-sm leading-none">
              Organization
            </legend>
            <div className="grid gap-2">
              {orgRows.map((org) => (
                <label
                  className="flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm has-checked:border-primary"
                  key={org.id}
                >
                  <input
                    className="size-4"
                    defaultChecked={org.id === orgRows[0]?.id}
                    name="organization_id"
                    required
                    type="radio"
                    value={org.id}
                  />
                  <Avatar className="size-7">
                    <AvatarImage src={org.logo || undefined} />
                    <AvatarFallback className="text-xs">
                      {org.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {org.name}
                    </span>
                    <span className="block text-muted-foreground text-xs">
                      {org.slug}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">
              Scopes: {parsed.data.scope}
            </p>
          </fieldset>
        ) : (
          <p className="text-muted-foreground text-sm">
            You are not a member of any organization yet.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            disabled={orgRows.length === 0}
            name="decision"
            type="submit"
            value="approve"
          >
            Authorize
          </Button>
          <Button name="decision" type="submit" value="deny" variant="outline">
            Deny
          </Button>
        </div>

        <p className="text-center text-muted-foreground text-xs">
          Access tokens are short-lived. You can revoke refresh access from the
          connected client.
        </p>
      </form>
    </div>
  );
}
