import {
  allowUnmeteredAiInDevelopment,
  autumn,
} from "@notra/ai/billing/autumn";
import { FEATURES } from "@notra/ai/billing/features";
import { shouldApplyMarkup } from "@notra/ai/billing/token-pricing";
import type { CheckResponse } from "autumn-js";

export type AgentCreditCheck =
  | { allowed: true; useMarkup: boolean }
  | { allowed: false; status: 403 | 500; error: string; code: string };

export async function checkAgentAiCredits(
  organizationId: string
): Promise<AgentCreditCheck> {
  if (!autumn || allowUnmeteredAiInDevelopment) {
    return { allowed: true, useMarkup: false };
  }
  let checkData: CheckResponse | null = null;
  try {
    checkData = await autumn.check({
      customerId: organizationId,
      featureId: FEATURES.AI_CREDITS,
    });
  } catch (checkError) {
    console.error("[Autumn] Check error:", {
      customerId: organizationId,
      error: checkError,
    });
    return {
      allowed: false,
      status: 500,
      error: "Failed to check usage limits",
      code: "BILLING_ERROR",
    };
  }

  if (!checkData?.allowed) {
    return {
      allowed: false,
      status: 403,
      error: "Usage limit reached",
      code: "USAGE_LIMIT_REACHED",
    };
  }

  return {
    allowed: true,
    useMarkup: shouldApplyMarkup(checkData.balance ?? null),
  };
}
