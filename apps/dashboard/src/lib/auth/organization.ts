import { db } from "@notra/db/drizzle";
import { members } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { type NextRequest, NextResponse } from "next/server";
import { organizationIdSchema } from "@/schemas/auth/organization";
import type { OrganizationAuth } from "@/types/auth/organization";
import { getServerSession } from "./session";

type AuthSession = Awaited<ReturnType<typeof getServerSession>>;
type OrganizationMembership = {
  id: string;
  role: string;
};

interface OrganizationAuthDependencies {
  getServerSession: typeof getServerSession;
  findMembership: (params: {
    organizationId: string;
    userId: string;
  }) => Promise<OrganizationMembership | undefined>;
  hasDatabaseUrl: () => boolean;
}

const organizationAuthDependencies: OrganizationAuthDependencies = {
  getServerSession,
  findMembership: async ({ organizationId, userId }) =>
    db.query.members.findFirst({
      where: and(eq(members.userId, userId), eq(members.organizationId, organizationId)),
      columns: {
        id: true,
        role: true,
      },
    }),
  hasDatabaseUrl: () => Boolean(process.env.DATABASE_URL),
};

export async function assertAuthenticatedWithDeps(
  { headers }: { headers: Headers },
  deps: Pick<OrganizationAuthDependencies, "getServerSession"> = organizationAuthDependencies
) {
  const { session, user } = (await deps.getServerSession({
    headers,
  })) as AuthSession;

  if (!(session && user)) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Unauthorized",
    });
  }

  return { session, user };
}

export async function assertAuthenticated(args: { headers: Headers }) {
  return assertAuthenticatedWithDeps(args);
}

export async function assertOrganizationAccessWithDeps(
  {
    headers,
    organizationId,
  }: {
    headers: Headers;
    organizationId: string;
  },
  deps: OrganizationAuthDependencies = organizationAuthDependencies
) {
  if (!deps.hasDatabaseUrl()) {
    throw new ORPCError("SERVICE_UNAVAILABLE", {
      message: "Database unavailable",
    });
  }

  const safeOrganizationId = organizationIdSchema.safeParse(organizationId);
  if (!safeOrganizationId.success) {
    throw new ORPCError("BAD_REQUEST", {
      data: {
        issues: safeOrganizationId.error.issues,
      },
      message: "Invalid organization ID",
    });
  }

  const { user } = await assertAuthenticatedWithDeps({ headers }, deps);

  const membership = await deps.findMembership({
    userId: user.id,
    organizationId: safeOrganizationId.data,
  });

  if (!membership) {
    throw new ORPCError("FORBIDDEN", {
      message: "You do not have access to this organization",
    });
  }

  return {
    user,
    organizationId: safeOrganizationId.data,
    membership,
  };
}

export async function assertOrganizationAccess({
  headers,
  organizationId,
}: {
  headers: Headers;
  organizationId: string;
}) {
  return assertOrganizationAccessWithDeps({
    headers,
    organizationId,
  });
}

export async function withOrganizationAuth(
  request: NextRequest,
  organizationId: string
): Promise<OrganizationAuth> {
  try {
    const context = await assertOrganizationAccess({
      headers: request.headers,
      organizationId,
    });

    return {
      success: true,
      context,
    };
  } catch (error) {
    if (error instanceof ORPCError) {
      return {
        success: false,
        response: NextResponse.json(
          { error: error.message, ...(error.data ? { details: error.data } : {}) },
          { status: error.status }
        ),
      };
    }

    throw error;
  }
}
