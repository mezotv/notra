import type { Plan } from "@notra/ai/types/router";
import { autumn } from "./autumn";
import { PAID_OR_LEGACY_PLAN_IDS } from "./features";

/**
 * Resolve an organization's billing plan for routing purposes.
 *
 * Mirrors the access check in the dashboard (`assertActiveSubscription`):
 * an active, non-add-on subscription on a paid or legacy plan counts as
 * "paid". Without a configured Autumn client every organization is "free".
 */
export async function resolveOrganizationPlan(
  organizationId: string
): Promise<Plan> {
  if (!autumn) {
    return "free";
  }

  const customer = await autumn.customers.getOrCreate({
    customerId: organizationId,
  });

  const hasPaidPlan = customer.subscriptions.some(
    (subscription) =>
      !subscription.addOn &&
      subscription.status === "active" &&
      PAID_OR_LEGACY_PLAN_IDS.has(subscription.planId)
  );

  return hasPaidPlan ? "paid" : "free";
}
