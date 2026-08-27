import { db } from "@notra/db/drizzle";
import { members, organizations } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";

import { isSessionBanned } from "@/lib/auth/banned";
import { getRequestSession } from "@/lib/auth/session";

export async function requireAuth() {
  const { session, user } = await getRequestSession();

  if (!(session && user)) {
    if (await isSessionBanned()) {
      redirect("/auth/banned");
    }
    redirect("/login");
  }

  return {
    session,
    user,
  };
}

export async function getOrganizationsForUser(userId: string) {
  const memberships = await db.query.members.findMany({
    where: eq(members.userId, userId),
    columns: {
      organizationId: true,
    },
    with: {
      organizations: {
        columns: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },
      },
    },
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });

  return memberships
    .map((membership) => membership.organizations)
    .filter((organization) => organization !== null);
}

export const validateOrganizationAccess = cache(async (slug: string) => {
  const { user } = await getRequestSession();

  if (!user) {
    if (await isSessionBanned()) {
      redirect("/auth/banned");
    }
    redirect("/login");
  }

  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
    with: {
      members: {
        where: eq(members.userId, user.id),
      },
    },
  });

  if (!organization || organization.members.length === 0) {
    redirect("/dashboard");
  }

  return {
    organization,
    user,
    member: organization.members[0],
  };
});
