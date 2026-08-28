"use server";

import { autumn } from "@notra/ai/billing/autumn";
import { checkTeamMembersLimit } from "@notra/ai/billing/team-members";
import {
  TEAM_MEMBER_LIMIT_CHECK_UNAVAILABLE_MESSAGE,
  TEAM_MEMBER_LIMIT_ERROR_MESSAGE,
} from "@notra/ai/constants/billing-limits";
import { seedSystemSkills } from "@notra/ai/skills/seed";
import { db } from "@notra/db/drizzle";
import { members, organizations, users } from "@notra/db/schema";
import { getWorkOS } from "@workos-inc/authkit-nextjs";
import type { Invitation } from "@workos-inc/node";
import { and, desc, eq } from "drizzle-orm";
import { Effect } from "effect";
import { isValid as isNotDisposableEmail } from "mailchecker";
import { cookies } from "next/headers";

import { LAST_VISITED_ORGANIZATION_COOKIE } from "@/constants/cookies";
import { readWorkOSError } from "@/lib/auth/workos-error";
import { OrganizationActionError } from "@/lib/organizations/errors";
import {
  requireManagerMembership,
  requireMembership,
  requireSession,
  resolveOrganizationId,
} from "@/lib/organizations/guards";
import { runOrganizationAction } from "@/lib/organizations/run-action";
import { validateActionInput } from "@/lib/organizations/validate-input";
import {
  ensureWorkOSOrganizationWithMembers,
  removeMembershipFromWorkOS,
  syncOrganizationNameToWorkOS,
  updateMembershipRoleInWorkOS,
} from "@/lib/organizations/workos-sync";
import {
  createOrganizationInputSchema,
  invitationActionInputSchema,
  inviteMemberInputSchema,
  organizationLookupQueryInputSchema,
  organizationScopedQueryInputSchema,
  removeMemberInputSchema,
  setActiveOrganizationInputSchema,
  updateMemberRoleInputSchema,
  updateOrganizationInputSchema,
} from "@/schemas/organizations/actions";
import type {
  ActionResult,
  CreateOrganizationInput,
  FullOrganization,
  InvitationActionInput,
  InvitationSummary,
  InviteMemberInput,
  ListMembersInput,
  MembersListResult,
  MemberWithUser,
  OrganizationRow,
  RemoveMemberInput,
  SetActiveOrganizationInput,
  UpdateMemberRoleInput,
  UpdateOrganizationInput,
} from "@/types/organizations/actions";

const enforceTeamMembersLimit = Effect.fn(
  "organizations.actions.enforceTeamMembersLimit"
)(function* (organizationId: string) {
  const status = yield* Effect.tryPromise({
    try: () => checkTeamMembersLimit(organizationId),
    catch: (cause) =>
      new OrganizationActionError({
        message: TEAM_MEMBER_LIMIT_CHECK_UNAVAILABLE_MESSAGE,
        cause,
      }),
  });

  if (status === "check-unavailable") {
    return yield* Effect.fail(
      new OrganizationActionError({
        message: TEAM_MEMBER_LIMIT_CHECK_UNAVAILABLE_MESSAGE,
      })
    );
  }

  if (status === "limit-reached") {
    return yield* Effect.fail(
      new OrganizationActionError({ message: TEAM_MEMBER_LIMIT_ERROR_MESSAGE })
    );
  }
});

const tryDb = <T>(run: () => Promise<T>, message: string) =>
  Effect.tryPromise({
    try: run,
    catch: (cause) => new OrganizationActionError({ message, cause }),
  });

const mapMemberRows = (
  rows: Array<{
    id: string;
    organizationId: string;
    userId: string;
    role: string;
    createdAt: Date;
    users: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    } | null;
  }>
): MemberWithUser[] =>
  rows.flatMap((row) => {
    if (!row.users) {
      return [];
    }

    return [
      {
        id: row.id,
        organizationId: row.organizationId,
        userId: row.userId,
        role: row.role,
        createdAt: row.createdAt,
        user: row.users,
      },
    ];
  });

const tryWorkOS = <T>(run: () => Promise<T>, fallbackMessage: string) =>
  Effect.tryPromise({
    try: run,
    catch: (cause) =>
      new OrganizationActionError({
        message: readWorkOSError(cause).message || fallbackMessage,
        cause,
      }),
  });

const mapInvitation = (invitation: Invitation): InvitationSummary => ({
  id: invitation.id,
  email: invitation.email,
  role: invitation.roleSlug,
  status: invitation.state,
  expiresAt: new Date(invitation.expiresAt),
  createdAt: new Date(invitation.createdAt),
  acceptInvitationUrl: invitation.acceptInvitationUrl,
});

const requireWorkOSOrganizationId = Effect.fn(
  "organizations.actions.requireWorkOSOrganizationId"
)(function* (organizationId: string) {
  return yield* ensureWorkOSOrganizationWithMembers(organizationId).pipe(
    Effect.catch((error) =>
      Effect.fail(
        new OrganizationActionError({
          message: "This organization is not linked to WorkOS yet",
          cause: error,
        })
      )
    )
  );
});

const requireInvitationManagement = Effect.fn(
  "organizations.actions.requireInvitationManagement"
)(function* (invitationId: string) {
  const session = yield* requireSession();

  const invitation = yield* tryWorkOS(
    () => getWorkOS().userManagement.getInvitation(invitationId),
    "Failed to load invitation"
  );

  if (!invitation.organizationId) {
    return yield* Effect.fail(
      new OrganizationActionError({ message: "Invitation not found" })
    );
  }

  const organization = yield* tryDb(
    () =>
      db.query.organizations.findFirst({
        where: eq(organizations.workosOrgId, invitation.organizationId ?? ""),
        columns: { id: true },
      }),
    "Failed to load organization"
  );

  if (!organization) {
    return yield* Effect.fail(
      new OrganizationActionError({ message: "Organization not found" })
    );
  }

  yield* requireManagerMembership(session, organization.id);
  return invitation;
});

export async function createOrganizationAction(
  rawInput: CreateOrganizationInput
): Promise<ActionResult<OrganizationRow>> {
  return runOrganizationAction(
    Effect.gen(function* () {
      const session = yield* requireSession();
      const input = yield* validateActionInput(
        createOrganizationInputSchema,
        rawInput
      );
      const { slug } = input;

      const existing = yield* tryDb(
        () =>
          db.query.organizations.findFirst({
            where: eq(organizations.slug, slug),
            columns: { id: true },
          }),
        "Failed to check organization slug"
      );

      if (existing) {
        return yield* Effect.fail(
          new OrganizationActionError({
            message: "An organization with this slug already exists",
          })
        );
      }

      const organizationId = crypto.randomUUID();
      const now = new Date();

      const [organization] = yield* tryDb(
        () =>
          db.transaction(async (tx) => {
            const inserted = await tx
              .insert(organizations)
              .values({
                id: organizationId,
                name: input.name,
                slug,
                logo: input.logo ?? null,
                createdAt: now,
              })
              .returning();

            await tx.insert(members).values({
              id: crypto.randomUUID(),
              organizationId,
              userId: session.user.id,
              role: "owner",
              createdAt: now,
            });

            return inserted;
          }),
        "Failed to create organization"
      );

      if (!organization) {
        return yield* Effect.fail(
          new OrganizationActionError({
            message: "Organization creation returned no row",
          })
        );
      }

      yield* ensureWorkOSOrganizationWithMembers(organizationId).pipe(
        Effect.catch((error) =>
          tryDb(
            () =>
              db
                .delete(organizations)
                .where(eq(organizations.id, organizationId)),
            "Failed to roll back organization"
          ).pipe(
            Effect.andThen(
              Effect.fail(
                new OrganizationActionError({
                  message: "Failed to link organization to WorkOS",
                  cause: error,
                })
              )
            )
          )
        )
      );

      yield* Effect.tryPromise({
        try: () => seedSystemSkills(organizationId),
        catch: (cause) =>
          new OrganizationActionError({
            message: "Failed to seed system skills",
            cause,
          }),
      }).pipe(
        Effect.catch((error) =>
          Effect.logWarning("Failed to seed system skills for new org").pipe(
            Effect.annotateLogs({ organizationId, error: error.message })
          )
        )
      );

      const autumnClient = autumn;
      if (autumnClient) {
        yield* Effect.tryPromise({
          try: () =>
            autumnClient.customers.getOrCreate({
              customerId: organizationId,
              name: input.name,
              metadata: { orgId: organizationId },
            }),
          catch: (cause) =>
            new OrganizationActionError({
              message: "Failed to create billing customer",
              cause,
            }),
        }).pipe(
          Effect.catch((error) =>
            Effect.logWarning("Failed to create Autumn customer").pipe(
              Effect.annotateLogs({ organizationId, error: error.message })
            )
          )
        );
      }

      if (!input.keepCurrentActiveOrganization) {
        const cookieStore = yield* tryDb(
          () => cookies(),
          "Failed to access cookies"
        );
        cookieStore.set(LAST_VISITED_ORGANIZATION_COOKIE, slug, { path: "/" });
      }

      return organization;
    })
  );
}

export async function updateOrganizationAction(
  rawInput: UpdateOrganizationInput
): Promise<ActionResult<OrganizationRow>> {
  return runOrganizationAction(
    Effect.gen(function* () {
      const session = yield* requireSession();
      const input = yield* validateActionInput(
        updateOrganizationInputSchema,
        rawInput
      );
      yield* requireManagerMembership(session, input.organizationId);

      const updates: Partial<{
        name: string;
        slug: string;
        logo: string | null;
      }> = {};

      if (input.data.name !== undefined) {
        updates.name = input.data.name;
      }

      if (input.data.logo !== undefined) {
        updates.logo = input.data.logo;
      }

      if (input.data.slug !== undefined) {
        updates.slug = input.data.slug;
      }

      const [organization] = yield* tryDb(
        () =>
          db
            .update(organizations)
            .set(updates)
            .where(eq(organizations.id, input.organizationId))
            .returning(),
        "Failed to update organization"
      );

      if (!organization) {
        return yield* Effect.fail(
          new OrganizationActionError({ message: "Organization not found" })
        );
      }

      if (updates.name !== undefined) {
        yield* syncOrganizationNameToWorkOS(input.organizationId, updates.name);
      }

      if (updates.slug) {
        const cookieStore = yield* tryDb(
          () => cookies(),
          "Failed to access cookies"
        );

        if (
          cookieStore.get(LAST_VISITED_ORGANIZATION_COOKIE)?.value !==
          organization.slug
        ) {
          cookieStore.set(LAST_VISITED_ORGANIZATION_COOKIE, organization.slug, {
            path: "/",
          });
        }
      }

      return organization;
    })
  );
}

export async function listOrganizationsAction(): Promise<
  ActionResult<OrganizationRow[]>
> {
  return runOrganizationAction(
    Effect.gen(function* () {
      const session = yield* requireSession();

      const rows = yield* tryDb(
        () =>
          db.query.members.findMany({
            where: eq(members.userId, session.user.id),
            orderBy: [desc(members.createdAt)],
            with: { organizations: true },
          }),
        "Failed to list organizations"
      );

      return rows.flatMap((row) =>
        row.organizations ? [row.organizations] : []
      );
    })
  );
}

function findOrganizationForSelection(input: SetActiveOrganizationInput) {
  if (input.organizationId) {
    return db.query.organizations.findFirst({
      where: eq(organizations.id, input.organizationId),
    });
  }

  if (input.organizationSlug) {
    return db.query.organizations.findFirst({
      where: eq(organizations.slug, input.organizationSlug),
    });
  }

  return Promise.resolve(undefined);
}

export async function setActiveOrganizationAction(
  rawInput: SetActiveOrganizationInput
): Promise<ActionResult<OrganizationRow>> {
  return runOrganizationAction(
    Effect.gen(function* () {
      const session = yield* requireSession();
      const input = yield* validateActionInput(
        setActiveOrganizationInputSchema,
        rawInput
      );

      const organization = yield* tryDb(
        () => findOrganizationForSelection(input),
        "Failed to load organization"
      );

      if (!organization) {
        return yield* Effect.fail(
          new OrganizationActionError({ message: "Organization not found" })
        );
      }

      yield* requireMembership(session, organization.id);

      const cookieStore = yield* tryDb(
        () => cookies(),
        "Failed to access cookies"
      );
      cookieStore.set(LAST_VISITED_ORGANIZATION_COOKIE, organization.slug, {
        path: "/",
      });

      return organization;
    })
  );
}

export async function getFullOrganizationAction(rawInput?: {
  query?: { organizationId?: string; organizationSlug?: string };
}): Promise<ActionResult<FullOrganization | null>> {
  return runOrganizationAction(
    Effect.gen(function* () {
      const session = yield* requireSession();
      const input = yield* validateActionInput(
        organizationLookupQueryInputSchema,
        rawInput
      );

      let organizationId = input?.query?.organizationId;

      if (!organizationId && input?.query?.organizationSlug) {
        const bySlug = yield* tryDb(
          () =>
            db.query.organizations.findFirst({
              where: eq(
                organizations.slug,
                input.query?.organizationSlug ?? ""
              ),
              columns: { id: true },
            }),
          "Failed to load organization"
        );
        organizationId = bySlug?.id;
      }

      if (!organizationId) {
        organizationId = session.session.activeOrganizationId ?? undefined;
      }

      if (!organizationId) {
        return null;
      }

      yield* requireMembership(session, organizationId);

      const organization = yield* tryDb(
        () =>
          db.query.organizations.findFirst({
            where: eq(organizations.id, organizationId ?? ""),
            with: {
              members: {
                with: {
                  users: {
                    columns: { id: true, name: true, email: true, image: true },
                  },
                },
              },
            },
          }),
        "Failed to load organization"
      );

      if (!organization) {
        return null;
      }

      const { members: memberRows, ...rest } = organization;

      const full: FullOrganization = {
        ...rest,
        members: mapMemberRows(memberRows),
      };

      return full;
    })
  );
}

export async function listMembersAction(
  rawInput?: ListMembersInput
): Promise<ActionResult<MembersListResult>> {
  return runOrganizationAction(
    Effect.gen(function* () {
      const session = yield* requireSession();
      const input = yield* validateActionInput(
        organizationScopedQueryInputSchema,
        rawInput
      );
      const organizationId = yield* resolveOrganizationId(
        session,
        input?.query?.organizationId
      );
      yield* requireMembership(session, organizationId);

      const rows = yield* tryDb(
        () =>
          db.query.members.findMany({
            where: eq(members.organizationId, organizationId),
            orderBy: [desc(members.createdAt)],
            with: {
              users: {
                columns: { id: true, name: true, email: true, image: true },
              },
            },
          }),
        "Failed to list members"
      );

      const mapped = mapMemberRows(rows);
      return { members: mapped, total: mapped.length };
    })
  );
}

export async function updateMemberRoleAction(
  rawInput: UpdateMemberRoleInput
): Promise<ActionResult<MemberWithUser | null>> {
  return runOrganizationAction(
    Effect.gen(function* () {
      const session = yield* requireSession();
      const input = yield* validateActionInput(
        updateMemberRoleInputSchema,
        rawInput
      );

      const member = yield* tryDb(
        () =>
          db.query.members.findFirst({
            where: eq(members.id, input.memberId),
          }),
        "Failed to load member"
      );

      if (!member) {
        return yield* Effect.fail(
          new OrganizationActionError({ message: "Member not found" })
        );
      }

      const callerMembership = yield* requireManagerMembership(
        session,
        member.organizationId
      );

      if (input.role === "owner" && callerMembership.role !== "owner") {
        return yield* Effect.fail(
          new OrganizationActionError({
            message: "Only the organization owner can assign the owner role",
          })
        );
      }

      if (member.role === "owner" && input.role !== "owner") {
        return yield* Effect.fail(
          new OrganizationActionError({
            message: "The organization owner role cannot be changed",
          })
        );
      }

      yield* tryDb(
        () =>
          db
            .update(members)
            .set({ role: input.role })
            .where(eq(members.id, input.memberId)),
        "Failed to update member role"
      );

      yield* updateMembershipRoleInWorkOS(
        member.organizationId,
        member.userId,
        input.role
      );

      const updated = yield* tryDb(
        () =>
          db.query.members.findFirst({
            where: eq(members.id, input.memberId),
            with: {
              users: {
                columns: { id: true, name: true, email: true, image: true },
              },
            },
          }),
        "Failed to load member"
      );

      return updated ? (mapMemberRows([updated])[0] ?? null) : null;
    })
  );
}

export async function removeMemberAction(
  rawInput: RemoveMemberInput
): Promise<ActionResult<{ removed: boolean }>> {
  return runOrganizationAction(
    Effect.gen(function* () {
      const session = yield* requireSession();
      const input = yield* validateActionInput(
        removeMemberInputSchema,
        rawInput
      );
      const organizationId = yield* resolveOrganizationId(
        session,
        input.organizationId
      );

      const isEmail = input.memberIdOrEmail.includes("@");

      const member = yield* tryDb(
        () =>
          isEmail
            ? db
                .select({
                  id: members.id,
                  userId: members.userId,
                  role: members.role,
                })
                .from(members)
                .innerJoin(users, eq(members.userId, users.id))
                .where(
                  and(
                    eq(members.organizationId, organizationId),
                    eq(users.email, input.memberIdOrEmail)
                  )
                )
                .then((rows) => rows[0])
            : db.query.members.findFirst({
                where: and(
                  eq(members.id, input.memberIdOrEmail),
                  eq(members.organizationId, organizationId)
                ),
                columns: { id: true, userId: true, role: true },
              }),
        "Failed to load member"
      );

      if (!member) {
        return yield* Effect.fail(
          new OrganizationActionError({ message: "Member not found" })
        );
      }

      const isSelfRemoval = member.userId === session.user.id;

      if (!isSelfRemoval) {
        yield* requireManagerMembership(session, organizationId);
      }

      if (member.role === "owner") {
        return yield* Effect.fail(
          new OrganizationActionError({
            message: "The organization owner cannot be removed",
          })
        );
      }

      yield* tryDb(
        () => db.delete(members).where(eq(members.id, member.id)),
        "Failed to remove member"
      );

      yield* removeMembershipFromWorkOS(organizationId, member.userId);

      return { removed: true };
    })
  );
}

export async function listInvitationsAction(rawInput?: {
  query?: { organizationId?: string };
}): Promise<ActionResult<InvitationSummary[]>> {
  return runOrganizationAction(
    Effect.gen(function* () {
      const session = yield* requireSession();
      const input = yield* validateActionInput(
        organizationScopedQueryInputSchema,
        rawInput
      );
      const organizationId = yield* resolveOrganizationId(
        session,
        input?.query?.organizationId
      );
      yield* requireMembership(session, organizationId);
      const workosOrgId = yield* requireWorkOSOrganizationId(organizationId);

      const invitations = yield* tryWorkOS(
        () =>
          getWorkOS().userManagement.listInvitations({
            organizationId: workosOrgId,
            limit: 100,
          }),
        "Failed to list invitations"
      );

      return invitations.data.map(mapInvitation);
    })
  );
}

export async function inviteMemberAction(
  rawInput: InviteMemberInput
): Promise<ActionResult<InvitationSummary>> {
  return runOrganizationAction(
    Effect.gen(function* () {
      const session = yield* requireSession();
      const input = yield* validateActionInput(
        inviteMemberInputSchema,
        rawInput
      );
      const organizationId = yield* resolveOrganizationId(
        session,
        input.organizationId
      );
      const callerMembership = yield* requireManagerMembership(
        session,
        organizationId
      );

      if (input.role === "owner" && callerMembership.role !== "owner") {
        return yield* Effect.fail(
          new OrganizationActionError({
            message: "Only the organization owner can assign the owner role",
          })
        );
      }

      if (!isNotDisposableEmail(input.email)) {
        return yield* Effect.fail(
          new OrganizationActionError({
            message: "Disposable email addresses are not allowed",
          })
        );
      }

      yield* enforceTeamMembersLimit(organizationId);
      const workosOrgId = yield* requireWorkOSOrganizationId(organizationId);

      const invitation = yield* tryWorkOS(
        () =>
          getWorkOS().userManagement.sendInvitation({
            email: input.email,
            organizationId: workosOrgId,
            roleSlug: input.role,
            inviterUserId: session.user.workosUserId ?? undefined,
          }),
        "Failed to send invitation"
      );

      return mapInvitation(invitation);
    })
  );
}

export async function cancelInvitationAction(
  rawInput: InvitationActionInput
): Promise<ActionResult<InvitationSummary>> {
  return runOrganizationAction(
    Effect.gen(function* () {
      const input = yield* validateActionInput(
        invitationActionInputSchema,
        rawInput
      );
      yield* requireInvitationManagement(input.invitationId);

      const revoked = yield* tryWorkOS(
        () => getWorkOS().userManagement.revokeInvitation(input.invitationId),
        "Failed to revoke invitation"
      );

      return mapInvitation(revoked);
    })
  );
}

export async function resendInvitationAction(
  rawInput: InvitationActionInput
): Promise<ActionResult<InvitationSummary>> {
  return runOrganizationAction(
    Effect.gen(function* () {
      const input = yield* validateActionInput(
        invitationActionInputSchema,
        rawInput
      );
      yield* requireInvitationManagement(input.invitationId);

      const invitation = yield* tryWorkOS(
        () => getWorkOS().userManagement.resendInvitation(input.invitationId),
        "Failed to resend invitation"
      );

      return mapInvitation(invitation);
    })
  );
}
