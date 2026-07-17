import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { assertImpersonationTargetAllowed } from "./impersonation";

describe("assertImpersonationTargetAllowed", () => {
  test("allows a regular active user", () => {
    assert.doesNotThrow(() =>
      assertImpersonationTargetAllowed({
        actorUserId: "admin-id",
        target: {
          id: "user-id",
          role: "user",
          banned: false,
        },
      })
    );
  });

  test("rejects self-impersonation", () => {
    assert.throws(
      () =>
        assertImpersonationTargetAllowed({
          actorUserId: "admin-id",
          target: {
            id: "admin-id",
            role: "admin",
            banned: false,
          },
        }),
      { message: "You cannot impersonate your own account" }
    );
  });

  test("rejects banned users", () => {
    assert.throws(
      () =>
        assertImpersonationTargetAllowed({
          actorUserId: "admin-id",
          target: {
            id: "user-id",
            role: "user",
            banned: true,
          },
        }),
      { message: "Banned users cannot be impersonated" }
    );
  });

  test("rejects admin users", () => {
    assert.throws(
      () =>
        assertImpersonationTargetAllowed({
          actorUserId: "admin-id",
          target: {
            id: "other-admin-id",
            role: "user,admin",
            banned: false,
          },
        }),
      { message: "Admin users cannot be impersonated" }
    );
  });
});
