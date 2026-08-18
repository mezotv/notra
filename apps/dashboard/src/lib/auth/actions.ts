"use server";

import { db } from "@notra/db/drizzle";
import { members, organizations } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { LAST_VISITED_ORGANIZATION_COOKIE } from "@/constants/cookies";
import { isSessionBanned } from "@/lib/auth/banned";
import { getAuthSession } from "@/lib/auth/server";
import { retryTransientDbError } from "@/lib/db/retry";

export async function validateOrganizationAccess(slug: string) {
  const session = await getAuthSession();

  if (!session?.user) {
    if (await isSessionBanned()) {
      redirect("/auth/banned");
    }
    redirect("/login");
  }

  const organization = await retryTransientDbError(() =>
    db.query.organizations.findFirst({
      where: eq(organizations.slug, slug),
      with: {
        members: {
          where: eq(members.userId, session.user.id),
        },
      },
    })
  );

  if (!organization || organization.members.length === 0) {
    const fallbackOrganization = await getLastActiveOrganizationForUser(
      session.user.id
    );
    if (fallbackOrganization && fallbackOrganization.slug !== slug) {
      redirect(`/${fallbackOrganization.slug}`);
    }
    notFound();
  }

  return {
    organization,
    user: session.user,
    member: organization.members[0],
  };
}

export async function getSession() {
  const session = await getAuthSession();

  return session;
}

export async function requireAuth() {
  const session = await getAuthSession();

  if (!session?.user) {
    if (await isSessionBanned()) {
      redirect("/auth/banned");
    }
    redirect("/login");
  }

  return {
    session: session.session,
    user: session.user,
  };
}

async function getLastActiveOrganizationForUser(userId: string) {
  const cookieStore = await cookies();
  const lastVisitedOrgSlug = cookieStore.get(
    LAST_VISITED_ORGANIZATION_COOKIE
  )?.value;

  if (lastVisitedOrgSlug) {
    const organization = await retryTransientDbError(() =>
      db.query.organizations.findFirst({
        where: eq(organizations.slug, lastVisitedOrgSlug),
        columns: { slug: true, id: true },
        with: {
          members: {
            where: eq(members.userId, userId),
            columns: { id: true },
          },
        },
      })
    );

    if (organization && organization.members.length > 0) {
      return { slug: organization.slug, id: organization.id };
    }
  }

  const ownerMembership = await retryTransientDbError(() =>
    db.query.members.findFirst({
      where: eq(members.userId, userId),
      columns: { organizationId: true, role: true },
      orderBy: (m, { desc }) => [desc(m.createdAt)],
    })
  );

  if (ownerMembership) {
    const org = await retryTransientDbError(() =>
      db.query.organizations.findFirst({
        where: eq(organizations.id, ownerMembership.organizationId),
        columns: { slug: true, id: true },
      })
    );

    if (org) {
      return { slug: org.slug, id: org.id };
    }
  }

  return;
}

export async function getLastActiveOrganization() {
  const session = await getAuthSession();

  if (!session?.user) {
    return;
  }

  return getLastActiveOrganizationForUser(session.user.id);
}

async function getAllOrganizationsForUser(userId: string) {
  const userMemberships = await retryTransientDbError(() =>
    db.query.members.findMany({
      where: eq(members.userId, userId),
      columns: { organizationId: true },
    })
  );

  const orgs = await Promise.all(
    userMemberships.map((m) =>
      retryTransientDbError(() =>
        db.query.organizations.findFirst({
          where: eq(organizations.id, m.organizationId),
          columns: { slug: true, id: true },
        })
      )
    )
  );

  return orgs.filter(
    (org): org is { slug: string; id: string } => org !== undefined
  );
}

export async function getAllUserOrganizations() {
  const session = await getAuthSession();

  if (!session?.user) {
    return [];
  }

  return getAllOrganizationsForUser(session.user.id);
}
