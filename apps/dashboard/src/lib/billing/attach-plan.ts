import type { AttachPlanParams, AttachPlanResult } from "@/types/billing/plan";
import { zdrAddonPlanId } from "@/utils/billing-plans";

export async function attachPlanWithAddons({
  attach,
  multiAttach,
  planId,
  includeZdr,
  successUrl,
}: AttachPlanParams): Promise<AttachPlanResult> {
  const zdrPlanId = includeZdr ? zdrAddonPlanId(planId) : null;

  if (zdrPlanId) {
    const result = await multiAttach({
      plans: [{ planId }, { planId: zdrPlanId }],
      redirectMode: "if_required",
      successUrl,
    });
    return { paymentUrl: result.paymentUrl ?? null };
  }

  const result = await attach({
    planId,
    redirectMode: "if_required",
    successUrl,
  });
  return { paymentUrl: result.paymentUrl ?? null };
}
