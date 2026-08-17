import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { decideGateway, rolloutBucket } from "./policy";
import { createPolicy } from "./test-helpers";

const ORG = "org_123";
const SAMPLE_SIZE = 1000;
const MIN_EXPECTED_SHARE = 0.4;
const MAX_EXPECTED_SHARE = 0.6;
const HALF_PERCENT = 50;
const FULL_PERCENT = 100;

describe("decideGateway", () => {
  test("paid organizations use the paid gateway (vercel)", () => {
    const decision = decideGateway({
      policy: createPolicy(),
      organizationId: ORG,
      plan: "paid",
    });
    assert.deepEqual(decision, { gateway: "vercel", reason: "paid" });
  });

  test("free organizations use the free gateway (openrouter) when mode=on", () => {
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

  test("mode=off keeps everything on vercel regardless of plan", () => {
    const policy = createPolicy({ mode: "off" });
    assert.equal(
      decideGateway({ policy, organizationId: ORG, plan: "free" }).gateway,
      "vercel"
    );
    assert.equal(decideGateway({ policy }).reason, "mode-off");
  });

  test("forceGateway overrides plan and default", () => {
    const policy = createPolicy({ forceGateway: "vercel" });
    assert.deepEqual(
      decideGateway({ policy, organizationId: ORG, plan: "free" }),
      { gateway: "vercel", reason: "forced" }
    );
    assert.deepEqual(decideGateway({ policy }), {
      gateway: "vercel",
      reason: "forced",
    });
  });

  test("pinned gateway wins over force", () => {
    const decision = decideGateway({
      policy: createPolicy({ forceGateway: "openrouter" }),
      organizationId: ORG,
      plan: "free",
      pinned: "vercel",
    });
    assert.deepEqual(decision, { gateway: "vercel", reason: "pinned" });
  });

  test("canary: allowlisted free orgs go to openrouter, others stay on vercel", () => {
    const policy = createPolicy({
      mode: "canary",
      orgAllowlist: new Set([ORG]),
    });
    assert.deepEqual(
      decideGateway({ policy, organizationId: ORG, plan: "free" }),
      { gateway: "openrouter", reason: "allowlist" }
    );
    assert.deepEqual(
      decideGateway({ policy, organizationId: "org_other", plan: "free" }),
      { gateway: "vercel", reason: "rollout-excluded" }
    );
  });

  test("canary: paid orgs are never part of the openrouter rollout", () => {
    const policy = createPolicy({
      mode: "canary",
      rolloutPercent: FULL_PERCENT,
      orgAllowlist: new Set([ORG]),
    });
    assert.deepEqual(
      decideGateway({ policy, organizationId: ORG, plan: "paid" }),
      { gateway: "vercel", reason: "paid" }
    );
  });

  test("canary: rollout percentage is deterministic per organization", () => {
    const policy = createPolicy({
      mode: "canary",
      rolloutPercent: HALF_PERCENT,
    });
    const first = decideGateway({ policy, organizationId: ORG, plan: "free" });
    const second = decideGateway({ policy, organizationId: ORG, plan: "free" });
    assert.deepEqual(first, second);

    const zero = createPolicy({ mode: "canary", rolloutPercent: 0 });
    const full = createPolicy({ mode: "canary", rolloutPercent: FULL_PERCENT });
    let rolledOut = 0;
    for (let index = 0; index < SAMPLE_SIZE; index += 1) {
      const organizationId = `org_${index}`;
      assert.equal(
        decideGateway({ policy: zero, organizationId, plan: "free" }).gateway,
        "vercel"
      );
      assert.equal(
        decideGateway({ policy: full, organizationId, plan: "free" }).gateway,
        "openrouter"
      );
      if (
        decideGateway({ policy, organizationId, plan: "free" }).gateway ===
        "openrouter"
      ) {
        rolledOut += 1;
      }
    }
    const share = rolledOut / SAMPLE_SIZE;
    assert.ok(
      share > MIN_EXPECTED_SHARE && share < MAX_EXPECTED_SHARE,
      `share=${share}`
    );
  });
});

describe("rolloutBucket", () => {
  test("returns a stable bucket in [0, 100)", () => {
    const bucket = rolloutBucket(ORG);
    assert.equal(bucket, rolloutBucket(ORG));
    assert.ok(bucket >= 0 && bucket < FULL_PERCENT);
  });
});
