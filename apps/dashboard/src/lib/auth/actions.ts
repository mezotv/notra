"use server";

import { db } from "@notra/db/drizzle";
import { members, organizations, projects } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { LAST_VISITED_ORGANIZATION_COOKIE } from "@/constants/cookies";
import { isSessionBanned } from "@/lib/auth/banned";
import { getAuthSession } from "@/lib/auth/server";
import { retryTransientDbError } from "@/lib/db/retry";
import { organizationSlugParamSchema } from "@/schemas/auth/organization";
import { getLastVisitedProject } from "@/utils/cookies";

const validateOrganizationAccessForRequest = cache(async (slug: string) => {
  const session = await getAuthSession();

  if (!session?.user) {
    if (await isSessionBanned()) {
      redirect("/auth/banned");
    }
    redirect(`/login?returnTo=${encodeURIComponent(`/${slug}`)}`);
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
    notFound();
  }

  return {
    organization,
    user: session.user,
    member: organization.members[0],
  };
});

export async function validateOrganizationAccess(rawSlug: string) {
  const slugValidation = organizationSlugParamSchema.safeParse(rawSlug);

  if (!slugValidation.success) {
    notFound();
  }

  return validateOrganizationAccessForRequest(slugValidation.data);
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

const getLastActiveOrganizationForUser = cache(async (userId: string) => {
  const cookieStore = await cookies();
  const lastVisitedOrgSlug = cookieStore.get(
    LAST_VISITED_ORGANIZATION_COOKIE
  )?.value;
  let activeOrganization: { id: string; slug: string } | undefined;

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
      activeOrganization = { slug: organization.slug, id: organization.id };
    }
  }

  if (!activeOrganization) {
    const membership = await retryTransientDbError(() =>
      db.query.members.findFirst({
        where: eq(members.userId, userId),
        columns: { organizationId: true },
        orderBy: (m, { desc }) => [desc(m.createdAt)],
        with: {
          organizations: {
            columns: { slug: true, id: true },
          },
        },
      })
    );

    if (membership) {
      activeOrganization = membership.organizations;
    }
  }

  if (!activeOrganization) {
    return;
  }

  const organization = activeOrganization;
  const lastVisitedProjectId = getLastVisitedProject(
    cookieStore,
    organization.slug
  );
  const project = lastVisitedProjectId
    ? await retryTransientDbError(() =>
        db.query.projects.findFirst({
          where: and(
            eq(projects.id, lastVisitedProjectId),
            eq(projects.organizationId, organization.id)
          ),
          columns: { id: true },
        })
      )
    : undefined;

  return { ...organization, projectId: project?.id };
});

export async function getLastActiveOrganization() {
  const session = await getAuthSession();

  if (!session?.user) {
    return;
  }

  return getLastActiveOrganizationForUser(session.user.id);
}

const getAllOrganizationsForUser = cache(async (userId: string) => {
  const userMemberships = await retryTransientDbError(() =>
    db.query.members.findMany({
      where: eq(members.userId, userId),
      columns: { organizationId: true },
      with: {
        organizations: {
          columns: { slug: true, id: true },
        },
      },
    })
  );

  return userMemberships.map((membership) => membership.organizations);
});

export async function getAllUserOrganizations() {
  const session = await getAuthSession();

  if (!session?.user) {
    return [];
  }

  return getAllOrganizationsForUser(session.user.id);
}
