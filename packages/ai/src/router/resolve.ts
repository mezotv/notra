import type {
  FallbackReason,
  GatewayId,
  PlanLookup,
  ResolverContext,
  RouteDecision,
  RouteRequest,
  UsableAdapter,
} from "@notra/ai/types/router";

import {
  GatewayCreditBalanceError,
  GatewayNotConfiguredError,
  NoCompliantRouteError,
  UnsupportedModelError,
} from "./errors";
import { decideGateway, otherGateway } from "./policy";

export async function lookupPlan(
  context: ResolverContext,
  organizationId: string
): Promise<PlanLookup> {
  const cached = await context.planCache.get(organizationId);
  if (cached) {
    return { plan: cached, source: "cache" };
  }

  try {
    const plan = await context.resolvePlan(organizationId);
    await context.planCache.set(organizationId, plan, context.planCacheTtlMs);
    return { plan, source: "resolver" };
  } catch (error) {
    context.logger.warn("ai.router.plan_lookup_failed", {
      organizationId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { plan: "free", source: "default" };
  }
}

function getUsableAdapter(
  context: ResolverContext,
  gateway: GatewayId,
  modelId: string,
  organizationId: string | undefined
): UsableAdapter | { unavailable: FallbackReason } {
  const adapter = context.adapters[gateway];
  if (!adapter) {
    return { unavailable: "not-configured" };
  }
  if (!adapter.supportsModel(modelId)) {
    return { unavailable: "unsupported-model" };
  }
  const unavailableReason = context.credits.unavailableReason(gateway);
  if (unavailableReason) {
    return { unavailable: unavailableReason };
  }
  if (adapter.enforcesZdr) {
    return { adapter, zdrEnforced: true };
  }
  if (context.policy.allowNonZdr) {
    context.logger.warn("ai.router.zdr_bypassed", {
      gateway: adapter.id,
      modelId,
      organizationId,
    });
    return { adapter, zdrEnforced: false };
  }
  return { unavailable: "non-compliant" };
}

function toDecision(
  usable: UsableAdapter,
  request: RouteRequest,
  planLookup: PlanLookup | undefined,
  reason: RouteDecision["reason"],
  fallback?: { from: GatewayId; reason: FallbackReason }
): RouteDecision {
  return {
    gateway: usable.adapter.id,
    requestedModelId: request.modelId,
    modelId: usable.adapter.mapModelId(request.modelId),
    organizationId: request.organizationId,
    plan: planLookup?.plan,
    planSource: planLookup?.source,
    reason,
    ...(fallback
      ? { fallbackFrom: fallback.from, fallbackReason: fallback.reason }
      : {}),
    zdrEnforced: usable.zdrEnforced,
  };
}

function throwUnavailable(
  gateway: GatewayId,
  modelId: string,
  reason: FallbackReason
): never {
  if (reason === "not-configured") {
    throw new GatewayNotConfiguredError(gateway);
  }
  if (reason === "unsupported-model") {
    throw new UnsupportedModelError(gateway, modelId);
  }
  if (reason === "no-credits") {
    throw new GatewayCreditBalanceError(0, gateway);
  }
  throw new NoCompliantRouteError(modelId, `${gateway}: ${reason}`);
}

/**
 * Pick the gateway for a request, verify the adapter can serve it and that
 * the route is privacy compliant. Falls back to the other gateway when the
 * preferred one is unavailable for the model.
 */
export async function resolveRoute(
  context: ResolverContext,
  request: RouteRequest
): Promise<RouteDecision> {
  const { modelId, organizationId } = request;

  let planLookup: PlanLookup | undefined;
  if (organizationId && !request.gateway) {
    planLookup = await lookupPlan(context, organizationId);
  }

  const decision = decideGateway({
    policy: context.policy,
    organizationId,
    plan: planLookup?.plan,
    pinned: request.gateway,
  });

  const primary = getUsableAdapter(
    context,
    decision.gateway,
    modelId,
    organizationId
  );
  if ("adapter" in primary) {
    return toDecision(primary, request, planLookup, decision.reason);
  }

  const canCrossGateway =
    context.policy.crossGatewayFallback && !request.gateway;
  if (!canCrossGateway) {
    // Pinned routes never move, and fallback can be disabled by injected test policies.
    throwUnavailable(decision.gateway, modelId, primary.unavailable);
  }

  const fallbackGateway = otherGateway(decision.gateway);
  const secondary = getUsableAdapter(
    context,
    fallbackGateway,
    modelId,
    organizationId
  );
  if ("adapter" in secondary) {
    context.logger.info("ai.router.fallback", {
      from: decision.gateway,
      to: secondary.adapter.id,
      fallbackReason: primary.unavailable,
      modelId,
      organizationId,
    });
    return toDecision(secondary, request, planLookup, "fallback", {
      from: decision.gateway,
      reason: primary.unavailable,
    });
  }

  if (
    primary.unavailable === "non-compliant" ||
    secondary.unavailable === "non-compliant"
  ) {
    context.logger.error("ai.router.no_compliant_route", {
      modelId,
      organizationId,
      primary: decision.gateway,
      primaryReason: primary.unavailable,
      secondaryReason: secondary.unavailable,
    });
    throw new NoCompliantRouteError(
      modelId,
      `${decision.gateway}: ${primary.unavailable}, ${fallbackGateway}: ${secondary.unavailable}`
    );
  }
  if (
    primary.unavailable === "not-configured" &&
    secondary.unavailable === "not-configured"
  ) {
    throw new GatewayNotConfiguredError("any");
  }
  if (primary.unavailable === "not-configured") {
    throwUnavailable(fallbackGateway, modelId, secondary.unavailable);
  }
  throwUnavailable(decision.gateway, modelId, primary.unavailable);
}
