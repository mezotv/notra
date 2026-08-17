import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { parseRouterConfig, ROUTER_ENV_KEYS } from "./router-config";

const ROLLOUT_PERCENT = 25;

describe("parseRouterConfig", () => {
  test("defaults keep the legacy behaviour (mode off, vercel for paid)", () => {
    const { policy, warnings } = parseRouterConfig({});
    assert.equal(policy.mode, "off");
    assert.equal(policy.defaultGateway, "openrouter");
    assert.equal(policy.paidGateway, "vercel");
    assert.equal(policy.freeGateway, "openrouter");
    assert.equal(policy.rolloutPercent, 0);
    assert.equal(policy.forceGateway, undefined);
    assert.equal(policy.crossGatewayFallback, true);
    assert.equal(policy.allowNonZdr, false);
    assert.deepEqual(warnings, []);
  });

  test("parses all keys", () => {
    const { policy, warnings } = parseRouterConfig({
      [ROUTER_ENV_KEYS.MODE]: "canary",
      [ROUTER_ENV_KEYS.DEFAULT_GATEWAY]: "vercel",
      [ROUTER_ENV_KEYS.PAID_GATEWAY]: "openrouter",
      [ROUTER_ENV_KEYS.FREE_GATEWAY]: "vercel",
      [ROUTER_ENV_KEYS.ROLLOUT_PERCENT]: String(ROLLOUT_PERCENT),
      [ROUTER_ENV_KEYS.ORG_ALLOWLIST]: "org_a, org_b,,",
      [ROUTER_ENV_KEYS.FORCE_GATEWAY]: "OpenRouter",
      [ROUTER_ENV_KEYS.CROSS_GATEWAY_FALLBACK]: "false",
    });
    assert.deepEqual(warnings, []);
    assert.equal(policy.mode, "canary");
    assert.equal(policy.defaultGateway, "vercel");
    assert.equal(policy.paidGateway, "openrouter");
    assert.equal(policy.freeGateway, "vercel");
    assert.equal(policy.rolloutPercent, ROLLOUT_PERCENT);
    assert.deepEqual([...policy.orgAllowlist], ["org_a", "org_b"]);
    assert.equal(policy.forceGateway, "openrouter");
    assert.equal(policy.crossGatewayFallback, false);
  });

  test("invalid values warn and fall back to safe defaults", () => {
    const { policy, warnings } = parseRouterConfig({
      [ROUTER_ENV_KEYS.MODE]: "sometimes",
      [ROUTER_ENV_KEYS.ROLLOUT_PERCENT]: "150",
      [ROUTER_ENV_KEYS.FORCE_GATEWAY]: "aws",
      [ROUTER_ENV_KEYS.CROSS_GATEWAY_FALLBACK]: "maybe",
    });
    assert.equal(policy.mode, "off");
    assert.equal(policy.rolloutPercent, 0);
    assert.equal(policy.forceGateway, undefined);
    assert.equal(policy.crossGatewayFallback, true);
    assert.deepEqual(
      warnings.map((warning) => warning.key),
      [
        ROUTER_ENV_KEYS.MODE,
        ROUTER_ENV_KEYS.ROLLOUT_PERCENT,
        ROUTER_ENV_KEYS.FORCE_GATEWAY,
        ROUTER_ENV_KEYS.CROSS_GATEWAY_FALLBACK,
      ]
    );
  });

  test("non-ZDR bypass only applies in development", () => {
    const production = parseRouterConfig({
      NODE_ENV: "production",
      [ROUTER_ENV_KEYS.ALLOW_NON_ZDR_IN_DEVELOPMENT]: "true",
    });
    assert.equal(production.policy.allowNonZdr, false);
    const development = parseRouterConfig({
      NODE_ENV: "development",
      [ROUTER_ENV_KEYS.ALLOW_NON_ZDR_IN_DEVELOPMENT]: "true",
    });
    assert.equal(development.policy.allowNonZdr, true);
  });
});
