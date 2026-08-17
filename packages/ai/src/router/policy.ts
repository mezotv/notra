import { sha256 } from "@noble/hashes/sha2.js";
import { utf8ToBytes } from "@noble/hashes/utils.js";
import type { GatewayId, Plan, RouteReason, RouterPolicyConfig } from "./types";

const ROLLOUT_BUCKETS = 100;
const ROLLOUT_HASH_PREFIX = "notra-router:";
const HASH_BYTES_FOR_BUCKET = 4;
const BYTE_SHIFT = 8;

/**
 * Deterministic 0..99 bucket for an organization id. Used for percentage
 * rollouts so the same organization always lands in the same bucket.
 */
export function rolloutBucket(organizationId: string): number {
  const digest = sha256(utf8ToBytes(`${ROLLOUT_HASH_PREFIX}${organizationId}`));
  let value = 0;
  for (let index = 0; index < HASH_BYTES_FOR_BUCKET; index += 1) {
    // Use multiplication instead of bit shifts to stay within safe integers.
    value = value * 2 ** BYTE_SHIFT + (digest[index] ?? 0);
  }
  return value % ROLLOUT_BUCKETS;
}

export interface DecideGatewayInput {
  policy: RouterPolicyConfig;
  organizationId?: string;
  plan?: Plan;
  pinned?: GatewayId;
}

export interface GatewayDecision {
  gateway: GatewayId;
  reason: RouteReason;
}

/**
 * Pure routing decision. No I/O, no adapter knowledge — the resolver applies
 * availability and compliance checks on top of this.
 */
export function decideGateway(input: DecideGatewayInput): GatewayDecision {
  const { policy, organizationId, plan, pinned } = input;

  if (pinned) {
    return { gateway: pinned, reason: "pinned" };
  }

  if (policy.forceGateway) {
    return { gateway: policy.forceGateway, reason: "forced" };
  }

  if (policy.mode === "off") {
    return { gateway: "vercel", reason: "mode-off" };
  }

  if (!organizationId) {
    return { gateway: policy.defaultGateway, reason: "no-org-default" };
  }

  if (plan === "paid") {
    return { gateway: policy.paidGateway, reason: "paid" };
  }

  if (policy.mode === "on") {
    return { gateway: policy.freeGateway, reason: "free" };
  }

  if (policy.orgAllowlist.has(organizationId)) {
    return { gateway: policy.freeGateway, reason: "allowlist" };
  }

  if (rolloutBucket(organizationId) < policy.rolloutPercent) {
    return { gateway: policy.freeGateway, reason: "rollout" };
  }

  return { gateway: "vercel", reason: "rollout-excluded" };
}

export function otherGateway(gateway: GatewayId): GatewayId {
  return gateway === "vercel" ? "openrouter" : "vercel";
}
