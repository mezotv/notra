import type { ContentBillingReservation } from "@notra/ai/types/billing";

import type { AutomatedWorkflowPauseReason } from "@/types/workflows/auto-pause";

export function resolveContentLimitPauseReason(
  reservation: ContentBillingReservation
): AutomatedWorkflowPauseReason {
  return reservation.reason === "quota_exhausted"
    ? "plan_limit_reached"
    : "ai_credits_depleted";
}
