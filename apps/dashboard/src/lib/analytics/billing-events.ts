import type { PostHogProperties } from "@notra/posthog/types/posthog";

import { BILLING_INTERVALS } from "@/constants/analytics-events";
import type {
  BillingInterval,
  PlanSelectedInput,
} from "@/types/analytics/events";

export function billingInterval(isYearly: boolean): BillingInterval {
  return isYearly ? BILLING_INTERVALS.YEAR : BILLING_INTERVALS.MONTH;
}

export function planSelectedProperties(
  input: PlanSelectedInput
): PostHogProperties {
  const plan = input.plans?.find((entry) => entry.id === input.planId);
  return {
    plan_id: input.planId,
    interval: billingInterval(input.isYearly),
    zdr: input.includeZdr,
    is_trial: Boolean(
      plan?.freeTrial && plan.customerEligibility?.trialAvailable
    ),
    surface: input.surface,
  };
}
