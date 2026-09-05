import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { PolicyTestCase } from "@notra/ai/types/router-test";

import { decideGateway } from "./policy";
import { createPolicy } from "./test-helpers";

describe("decideGateway", () => {
  test("honours configured gateways and pin → organization → plan precedence", () => {
    const policy = createPolicy({
      paidGateway: "openrouter",
      freeGateway: "vercel",
      defaultGateway: "vercel",
    });
    const cases: PolicyTestCase[] = [
      {
        name: "custom paid gateway",
        input: { organizationId: "org", plan: "paid" },
        expected: { gateway: "openrouter", reason: "paid" },
      },
      {
        name: "custom free gateway",
        input: { organizationId: "org", plan: "free" },
        expected: { gateway: "vercel", reason: "free" },
      },
      {
        name: "unknown plan defaults to free",
        input: { organizationId: "org" },
        expected: { gateway: "vercel", reason: "free" },
      },
      {
        name: "no organization uses default even with a paid plan",
        input: { plan: "paid" },
        expected: { gateway: "vercel", reason: "no-org-default" },
      },
      {
        name: "pin overrides paid plan",
        input: { organizationId: "org", plan: "paid", pinned: "vercel" },
        expected: { gateway: "vercel", reason: "pinned" },
      },
      {
        name: "pin overrides default without an organization",
        input: { pinned: "openrouter" },
        expected: { gateway: "openrouter", reason: "pinned" },
      },
    ];
    for (const { name, input, expected } of cases) {
      assert.deepEqual(decideGateway({ ...input, policy }), expected, name);
    }
  });
});
