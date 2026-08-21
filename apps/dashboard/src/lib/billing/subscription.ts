import {
  allowUnmeteredAiInDevelopment,
  autumn,
} from "@notra/ai/billing/autumn";
import {
  FEATURES,
  PAID_OR_LEGACY_PLAN_IDS,
  PRO_PLAN_IDS,
} from "@notra/ai/billing/features";
import { ORPCError } from "@orpc/server";
import { internalServerError, paymentRequired } from "@/lib/orpc/utils/errors";

async function hasAiCreditsBalance(organizationId: string): Promise<boolean> {
  if (!autumn) {
    return false;
  }

  const data = await autumn.check({
    customerId: organizationId,
    featureId: FEATURES.AI_CREDITS,
    requiredBalance: 1,
  });

  return data.allowed === true;
}

async function hasAiCreditsGrant(organizationId: string): Promise<boolean> {
  if (!autumn) {
    return false;
  }

  const data = await autumn.check({
    customerId: organizationId,
    featureId: FEATURES.AI_CREDITS,
  });

  return data.balance != null;
}

/**
 * Non-throwing Pro check used to gate Pro-only settings (e.g. GEO zero data
 * retention). Development without billing counts as Pro; a billing outage
 * counts as not Pro so gated settings fail closed.
 */
export async function hasProSubscription(
  organizationId: string
): Promise<boolean> {
  if (allowUnmeteredAiInDevelopment) {
    return true;
  }
  if (!autumn) {
    return process.env.NODE_ENV !== "production";
  }
  try {
    const customer = await autumn.customers.getOrCreate({
      customerId: organizationId,
    });
    return customer.subscriptions.some(
      (subscription) =>
        !subscription.addOn &&
        subscription.status === "active" &&
        PRO_PLAN_IDS.has(subscription.planId)
    );
  } catch {
    return false;
  }
}

export async function assertActiveSubscription(
  organizationId: string
): Promise<void> {
  if (allowUnmeteredAiInDevelopment) {
    return;
  }

  if (!autumn) {
    if (process.env.NODE_ENV === "production") {
      throw internalServerError("Billing is not configured");
    }
    return;
  }

  let hasAccess = false;

  try {
    const customer = await autumn.customers.getOrCreate({
      customerId: organizationId,
    });

    hasAccess = customer.subscriptions.some(
      (subscription) =>
        !subscription.addOn &&
        subscription.status === "active" &&
        PAID_OR_LEGACY_PLAN_IDS.has(subscription.planId)
    );

    if (!hasAccess) {
      hasAccess = await hasAiCreditsBalance(organizationId);
    }
  } catch (error) {
    if (error instanceof ORPCError) {
      throw error;
    }
    throw internalServerError("Failed to verify subscription status");
  }

  if (!hasAccess) {
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

    const hasHistory = customer.subscriptions.some(
      (subscription) =>
        !subscription.addOn && PAID_OR_LEGACY_PLAN_IDS.has(subscription.planId)
    );

    if (hasHistory) {
      return true;
    }

    return await hasAiCreditsGrant(organizationId);
  } catch {
    return true;
  }
}
