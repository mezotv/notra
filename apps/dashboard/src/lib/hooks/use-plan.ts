"use client";

import { PRO_PLAN_IDS } from "@notra/ai/billing/features";
import { useCustomer } from "autumn-js/react";

/**
 * Resolves the organization's active plan from Autumn. `isPro` is false while
 * loading; check `isLoading` before treating it as a final answer.
 */
export function useIsProPlan() {
  const { data: customer, isLoading } = useCustomer({
    expand: ["subscriptions.plan"],
  });
  const activeSubscription = customer?.subscriptions.find(
    (subscription) => !subscription.addOn && subscription.status === "active"
  );
  const activePlanId =
    activeSubscription?.plan?.id ?? activeSubscription?.planId;
  const isPro = activePlanId ? PRO_PLAN_IDS.has(activePlanId) : false;
  return { isPro, isLoading, activePlanId };
}
