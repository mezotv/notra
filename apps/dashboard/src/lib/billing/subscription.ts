import { autumn } from "@notra/ai/billing/autumn";
import { PAID_OR_LEGACY_PLAN_IDS } from "@notra/ai/billing/features";
import { ORPCError } from "@orpc/server";
import { internalServerError, paymentRequired } from "@/lib/orpc/utils/errors";

export async function assertActiveSubscription(
  organizationId: string
): Promise<void> {
  if (!autumn) {
    return;
  }

  let hasActivePlan = false;

  try {
    const customer = await autumn.customers.getOrCreate({
      customerId: organizationId,
    });

    hasActivePlan = customer.subscriptions.some(
      (subscription) =>
        !subscription.addOn &&
        subscription.status === "active" &&
        PAID_OR_LEGACY_PLAN_IDS.has(subscription.planId)
    );
  } catch (error) {
    if (error instanceof ORPCError) {
      throw error;
    }
    throw internalServerError("Failed to verify subscription status");
  }

  if (!hasActivePlan) {
    throw paymentRequired("Active subscription required");
  }
}

export async function hasPaidSubscriptionHistory(
  organizationId: string
): Promise<boolean> {
  if (!autumn) {
    return true;
  }

  try {
    const customer = await autumn.customers.getOrCreate({
      customerId: organizationId,
    });

    return customer.subscriptions.some(
      (subscription) =>
        !subscription.addOn && PAID_OR_LEGACY_PLAN_IDS.has(subscription.planId)
    );
  } catch {
    return true;
  }
}
