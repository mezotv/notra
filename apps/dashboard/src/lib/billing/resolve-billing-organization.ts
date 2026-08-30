import { db } from "@notra/db/drizzle";
import { members, organizations } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { AUTUMN_ORGANIZATION_HEADER } from "@/constants/billing";
import { organizationSlugParamSchema } from "@/schemas/auth/organization";
import type { AuthSessionData } from "@/types/auth/session";

const findMemberOrganizationIdBySlug = Effect.fn(
  "billing.resolveOrganization.bySlug"
)(function* (slug: string, userId: string) {
  const organization = yield* Effect.tryPromise(() =>
    db.query.organizations.findFirst({
      where: eq(organizations.slug, slug),
      columns: { id: true },
      with: {
        members: {
          where: eq(members.userId, userId),
          columns: { id: true },
        },
      },
    })
  );

  if (!organization || organization.members.length === 0) {
    return null;
  }

  return organization.id;
});

export async function resolveBillingOrganizationId(
  request: Request,
  session: AuthSessionData
): Promise<string | null> {
  const requestedSlug = organizationSlugParamSchema.safeParse(
    request.headers.get(AUTUMN_ORGANIZATION_HEADER)
  );

  if (requestedSlug.success) {
    return await Effect.runPromise(
      findMemberOrganizationIdBySlug(requestedSlug.data, session.user.id).pipe(
        Effect.catch(() => Effect.succeed(null))
      )
    );
  }

  return session.session.activeOrganizationId ?? null;
}
