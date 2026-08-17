import { enrichRouteMetadata, getRouteMetadata } from "@notra/ai/gateway";
import type { RouteMetadata } from "@notra/ai/router/types";
import type { ProviderMetadata } from "ai";

export interface RouteUsageSummary {
  /** Route metadata of the last model call (gateway, upstream provider, ...). */
  route?: RouteMetadata;
  /** Sum of gateway-reported costs across all steps, when available. */
  costUsd?: number;
}

interface StepLike {
  providerMetadata?: ProviderMetadata;
}

/**
 * Collect router metadata from the steps of a generate/stream result so
 * usage sinks can record the selected gateway and reported cost.
 */
export async function summarizeRouteUsage(
  steps: readonly StepLike[] | undefined
): Promise<RouteUsageSummary> {
  if (!steps || steps.length === 0) {
    return {};
  }

  let route: RouteMetadata | undefined;
  let costUsd: number | undefined;

  for (const step of steps) {
    const routeMetadata = getRouteMetadata(step.providerMetadata);
    if (!routeMetadata) {
      continue;
    }
    const metadata = await enrichRouteMetadata(routeMetadata);
    route = metadata;
    if (typeof metadata.costUsd === "number") {
      costUsd = (costUsd ?? 0) + metadata.costUsd;
    }
  }

  return { route, costUsd };
}

/**
 * Flatten route metadata into snake_case properties for billing/usage events.
 */
export function routeUsageProperties(summary: RouteUsageSummary | undefined) {
  if (!summary?.route) {
    return {};
  }
  const { route } = summary;
  return {
    gateway: route.gateway,
    upstream_provider: route.upstreamProvider,
    route_reason: route.reason,
    fallback_from: route.fallbackFrom,
    fallback_reason: route.fallbackReason,
    gateway_reported_usd: summary.costUsd,
  };
}
