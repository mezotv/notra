import { ORPCError } from "@orpc/server";
import { Effect } from "effect";
import { NextResponse } from "next/server";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { forbidden, internalServerError } from "@/lib/orpc/utils/errors";
import { resolveMemberScopes } from "@/lib/permissions/resolve-scopes";
import type {
  AssertOrganizationScopesParams,
  ScopedOrganizationAuth,
  ScopedOrganizationContext,
} from "@/types/permissions";

export async function assertOrganizationScopes({
  headers,
  organizationId,
  user,
  scopes,
  anyOfScopes,
}: AssertOrganizationScopesParams): Promise<ScopedOrganizationContext> {
  const access = await assertOrganizationAccess({
    headers,
    organizationId,
    user,
  });

  const memberScopes = await Effect.runPromise(
    resolveMemberScopes({
      memberId: access.membership.id,
      memberRole: access.membership.role,
      organizationId: access.organizationId,
    }).pipe(
      Effect.match({
        onFailure: () => null,
        onSuccess: (resolved) => resolved,
      })
    )
  );

  if (!memberScopes) {
    throw internalServerError("Failed to resolve permissions");
  }

  const memberScopeSet = new Set(memberScopes);

  if (scopes && scopes.length > 0) {
    const missing = scopes.filter((scope) => !memberScopeSet.has(scope));
    if (missing.length > 0) {
      throw forbidden(`Missing required permissions: ${missing.join(", ")}`);
    }
  }

  if (
    anyOfScopes &&
    anyOfScopes.length > 0 &&
    !anyOfScopes.some((scope) => memberScopeSet.has(scope))
  ) {
    throw forbidden(
      `Missing required permissions: one of ${anyOfScopes.join(", ")}`
    );
  }

  return {
    ...access,
    scopes: memberScopes,
  };
}

export async function withOrganizationScopes(
  request: Request,
  organizationId: string,
  options: {
    scopes?: AssertOrganizationScopesParams["scopes"];
    anyOfScopes?: AssertOrganizationScopesParams["anyOfScopes"];
  } = {}
): Promise<ScopedOrganizationAuth> {
  try {
    const context = await assertOrganizationScopes({
      headers: request.headers,
      organizationId,
      scopes: options.scopes,
      anyOfScopes: options.anyOfScopes,
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
          {
            error: error.message,
            ...(error.data ? { details: error.data } : {}),
          },
          { status: error.status }
        ),
      };
    }

    throw error;
  }
}
