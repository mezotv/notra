import { describe, expect, test } from "bun:test";
import { ORPCError } from "@orpc/server";
import {
  assertAuthenticatedWithDeps,
  assertOrganizationAccessWithDeps,
} from "./organization";

function createSessionDeps(overrides = {}) {
  return {
    getServerSession: async () => ({
      session: { id: "session_123" },
      user: { id: "user_123", email: "user@example.com" },
    }),
    findMembership: async () => ({ id: "membership_123", role: "owner" }),
    hasDatabaseUrl: () => true,
    ...overrides,
  };
}

describe("assertAuthenticatedWithDeps", () => {
  test("throws UNAUTHORIZED when the user is not signed in", async () => {
    const deps = createSessionDeps({
      getServerSession: async () => ({ session: null, user: null }),
    });

    try {
      await assertAuthenticatedWithDeps({ headers: new Headers() }, deps);
      throw new Error("Expected assertAuthenticatedWithDeps to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.message).toBe("Unauthorized");
    }
  });
});

describe("assertOrganizationAccessWithDeps", () => {
  test("throws SERVICE_UNAVAILABLE when the database URL is missing", async () => {
    const deps = createSessionDeps({
      hasDatabaseUrl: () => false,
    });

    try {
      await assertOrganizationAccessWithDeps(
        {
          headers: new Headers(),
          organizationId: "org_123",
        },
        deps
      );
      throw new Error("Expected assertOrganizationAccessWithDeps to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      expect(error.code).toBe("SERVICE_UNAVAILABLE");
    }
  });

  test("throws FORBIDDEN when the user is not a member of the organization", async () => {
    const deps = createSessionDeps({
      findMembership: async () => undefined,
    });

    try {
      await assertOrganizationAccessWithDeps(
        {
          headers: new Headers(),
          organizationId: "org_123",
        },
        deps
      );
      throw new Error("Expected assertOrganizationAccessWithDeps to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      expect(error.code).toBe("FORBIDDEN");
      expect(error.message).toBe("You do not have access to this organization");
    }
  });

  test("returns the authenticated user and membership when access is allowed", async () => {
    const deps = createSessionDeps();

    const result = await assertOrganizationAccessWithDeps(
      {
        headers: new Headers(),
        organizationId: "org_123",
      },
      deps
    );

    expect(result.organizationId).toBe("org_123");
    expect(result.user.id).toBe("user_123");
    expect(result.membership).toEqual({
      id: "membership_123",
      role: "owner",
    });
  });
});
