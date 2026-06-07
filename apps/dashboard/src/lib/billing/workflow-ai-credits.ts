import { autumn } from "@notra/ai/billing/autumn";
import { ACTIVE_PAID_PLAN_IDS, FEATURES } from "@notra/ai/billing/features";
import { shouldApplyMarkup } from "@notra/ai/billing/token-pricing";
import type { CheckResponse } from "autumn-js";
import type { WorkflowAiCreditGateResult } from "@/types/billing/workflow-ai-credits";

export async function checkWorkflowAiCredits(
  organizationId: string
): Promise<WorkflowAiCreditGateResult> {
  if (!autumn) {
    return { allowed: true, reserved: false, useMarkup: false };
  }

  const customer = await autumn.customers.getOrCreate({
    customerId: organizationId,
  });

  const hasActivePaidPlan = customer.subscriptions.some(
    (subscription) =>
      !subscription.addOn &&
      subscription.status === "active" &&
      ACTIVE_PAID_PLAN_IDS.has(subscription.planId)
  );

  if (!hasActivePaidPlan) {
    return {
      allowed: false,
      reason: "no_active_paid_plan",
      shouldNotify: false,
      balanceRemaining: null,
    };
  }

  let data: CheckResponse | null = null;
  try {
    data = await autumn.check({
      customerId: organizationId,
      featureId: FEATURES.AI_CREDITS,
      requiredBalance: 1,
    });
  } catch (error) {
    throw new Error(`Autumn check failed: ${String(error)}`);
  }

  const balanceRemaining =
    typeof data?.balance?.remaining === "number" ? data.balance.remaining : 0;

  if (!data?.allowed || balanceRemaining <= 0) {
    return {
      allowed: false,
      reason: "insufficient_ai_credits",
      shouldNotify: true,
      balanceRemaining,
    };
  }

  return {
    allowed: true,
    reserved: true,
    useMarkup: shouldApplyMarkup(data.balance ?? null),
  };
}
