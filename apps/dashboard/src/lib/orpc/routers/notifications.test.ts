import { beforeEach, expect, mock, test } from "bun:test";

import { call, ORPCError, os } from "@orpc/server";

const access = mock(async () => ({ membership: { role: "owner" } }));
const subscription = mock(async () => {
  throw new ORPCError("FORBIDDEN", { message: "Subscription expired" });
});
const returning = mock(async () => [{ dailySummary: false }]);
const insert = mock(() => ({
  values: () => ({ onConflictDoUpdate: () => ({ returning }) }),
}));

mock.module("@/lib/orpc/base", () => ({ authorizedProcedure: os }));
mock.module("@/lib/auth/organization", () => ({
  assertOrganizationAccess: access,
}));
mock.module("@/lib/billing/subscription", () => ({
  assertActiveSubscription: subscription,
}));
mock.module("@notra/db/drizzle", () => ({ db: { insert } }));
const { notificationsRouter } = await import("./notifications");

beforeEach(() => {
  access.mockResolvedValue({ membership: { role: "owner" } });
  subscription.mockClear();
  insert.mockClear();
});

test("expired owners can disable recap emails", async () => {
  await call(notificationsRouter.update, {
    organizationId: "org",
    dailySummary: false,
  });
  expect(subscription).not.toHaveBeenCalled();
  expect(insert).toHaveBeenCalledTimes(1);
});

test("enabling notifications still requires a subscription", async () => {
  await expect(
    call(notificationsRouter.update, {
      organizationId: "org",
      dailySummary: true,
    })
  ).rejects.toThrow("Subscription expired");
  expect(subscription).toHaveBeenCalledTimes(1);
  expect(insert).not.toHaveBeenCalled();
});

test("a mixed opt-out and opt-in cannot bypass the subscription gate", async () => {
  await expect(
    call(notificationsRouter.update, {
      organizationId: "org",
      dailySummary: false,
      marketingEmails: true,
    })
  ).rejects.toThrow("Subscription expired");
  expect(insert).not.toHaveBeenCalled();
});

test("non-owners cannot change preferences", async () => {
  access.mockResolvedValue({ membership: { role: "member" } });
  await expect(
    call(notificationsRouter.update, {
      organizationId: "org",
      dailySummary: false,
    })
  ).rejects.toThrow("Only the organization owner");
  expect(insert).not.toHaveBeenCalled();
});
