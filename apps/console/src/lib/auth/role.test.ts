import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { hasAdminRole } from "./role";

describe("hasAdminRole", () => {
  test("accepts the platform admin role", () => {
    assert.equal(hasAdminRole("admin"), true);
    assert.equal(hasAdminRole("user,admin"), true);
    assert.equal(hasAdminRole(" admin "), true);
    assert.equal(hasAdminRole("user, admin "), true);
  });

  test("rejects non-admin and missing roles", () => {
    assert.equal(hasAdminRole(""), false);
    assert.equal(hasAdminRole("user"), false);
    assert.equal(hasAdminRole("owner"), false);
    assert.equal(hasAdminRole("member"), false);
    assert.equal(hasAdminRole(null), false);
    assert.equal(hasAdminRole(undefined), false);
  });
});
