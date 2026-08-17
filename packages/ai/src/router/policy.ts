import type { GatewayId, Plan, RouteReason, RouterPolicyConfig } from "./types";

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

  if (!organizationId) {
    return { gateway: policy.defaultGateway, reason: "no-org-default" };
  }

  if (plan === "paid") {
    return { gateway: policy.paidGateway, reason: "paid" };
  }

  return { gateway: policy.freeGateway, reason: "free" };
}

export function otherGateway(gateway: GatewayId): GatewayId {
  return gateway === "vercel" ? "openrouter" : "vercel";
}
