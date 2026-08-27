import { ACTIVE_PAID_PLAN_IDS } from "@notra/ai/billing/features";

import type { BillingCustomer } from "@/types/billing/plan";

export function hasIncludedChatPlan(
  customer: Pick<BillingCustomer, "subscriptions"> | null | undefined
): boolean {
  return (
    customer?.subscriptions?.some(
      (subscription) =>
        !subscription.addOn &&
        subscription.status === "active" &&
        ACTIVE_PAID_PLAN_IDS.has(subscription.planId)
    ) ?? false
  );
}
