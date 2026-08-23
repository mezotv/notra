import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { decideGateway } from "./policy";
import { createPolicy } from "./test-helpers";

const ORG = "org_123";

describe("decideGateway", () => {
  test("paid organizations use the paid gateway (vercel)", () => {
    const decision = decideGateway({
      policy: createPolicy(),
      organizationId: ORG,
      plan: "paid",
    });
    assert.deepEqual(decision, { gateway: "vercel", reason: "paid" });
  });

  test("free organizations use the free gateway (openrouter)", () => {
    const decision = decideGateway({
      policy: createPolicy(),
      organizationId: ORG,
      plan: "free",
    });
    assert.deepEqual(decision, { gateway: "openrouter", reason: "free" });
  });

  test("missing organization context uses the explicit default gateway", () => {
    const decision = decideGateway({ policy: createPolicy() });
    assert.deepEqual(decision, {
      gateway: "openrouter",
      reason: "no-org-default",
    });
    const vercelDefault = decideGateway({
      policy: createPolicy({ defaultGateway: "vercel" }),
    });
    assert.equal(vercelDefault.gateway, "vercel");
  });

  test("a pinned gateway overrides plan routing", () => {
    const decision = decideGateway({
      policy: createPolicy(),
      organizationId: ORG,
      plan: "free",
      pinned: "vercel",
    });
    assert.deepEqual(decision, { gateway: "vercel", reason: "pinned" });
  });
});
