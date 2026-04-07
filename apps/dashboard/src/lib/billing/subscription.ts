import { ORPCError } from "@orpc/server";
import { PAID_OR_LEGACY_PLAN_IDS, PLANS } from "@/constants/features";
import { internalServerError, paymentRequired } from "@/lib/orpc/utils/errors";
import { autumn } from "./autumn";

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
        !subscription.addOn &&
        subscription.planId !== PLANS.FREE &&
        PAID_OR_LEGACY_PLAN_IDS.has(subscription.planId)
    );
  } catch {
    return true;
  }
}
