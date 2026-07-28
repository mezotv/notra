import { autumn } from "@notra/ai/billing/autumn";
import { FEATURES } from "@notra/ai/billing/features";
import { isFreeEmail } from "free-email-domains-list";
import {
  SIGNUP_CREDITS_BALANCE_PREFIX,
  SIGNUP_CREDITS_GRANT_CENTS,
} from "@/constants/signup-credits";
import type {
  SignupCreditsGrantInput,
  SignupCreditsGrantResult,
} from "@/types/billing/signup-credits";

export async function grantSignupCredits({
  email,
  organizationId,
}: SignupCreditsGrantInput): Promise<SignupCreditsGrantResult> {
  if (!autumn || isFreeEmail(email.trim().toLowerCase())) {
    return { granted: false };
  }

  try {
    await autumn.balances.create({
      balanceId: `${SIGNUP_CREDITS_BALANCE_PREFIX}-${organizationId}`,
      customerId: organizationId,
      featureId: FEATURES.AI_CREDITS,
      includedGrant: SIGNUP_CREDITS_GRANT_CENTS,
    });
    return { granted: true };
  } catch (error) {
    console.error(
      `[Onboarding Agent] Signup credits grant failed for ${organizationId}`,
      error
    );
    return { granted: false };
  }
}
