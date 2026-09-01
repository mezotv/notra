import { checkChatBilling } from "@notra/ai/billing/chat-billing";
import type { ChatBillingCheck } from "@notra/ai/types/billing";

export type AgentCreditCheck =
  | { allowed: true; useMarkup: boolean; chargeAiCredits: boolean }
  | { allowed: false; status: 403 | 500; error: string; code: string };

export async function checkAgentAiCredits(
  organizationId: string
): Promise<AgentCreditCheck> {
  let billing: ChatBillingCheck;
  try {
    billing = await checkChatBilling(organizationId);
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

  if (!billing.allowed) {
    return {
      allowed: false,
      status: 403,
      error: "Usage limit reached",
      code: "USAGE_LIMIT_REACHED",
    };
  }

  return {
    allowed: true,
    useMarkup: billing.useMarkup,
    chargeAiCredits: billing.chargeAiCredits,
  };
}
