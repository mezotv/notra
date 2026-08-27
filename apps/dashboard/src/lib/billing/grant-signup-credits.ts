import { autumn } from "@notra/ai/billing/autumn";
import { FEATURES } from "@notra/ai/billing/features";
import { db } from "@notra/db/drizzle";
import { members, users } from "@notra/db/schema";
import { and, eq, ne } from "drizzle-orm";
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
  const normalizedEmail = email.trim().toLowerCase();

  if (!autumn || isFreeEmail(normalizedEmail)) {
    return { granted: false };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
    columns: { id: true, emailVerified: true },
  });

  if (!user?.emailVerified) {
    return { granted: false };
  }

  const otherOwnedOrganization = await db.query.members.findFirst({
    where: and(
      eq(members.userId, user.id),
      eq(members.role, "owner"),
      ne(members.organizationId, organizationId)
    ),
    columns: { id: true },
  });

  if (otherOwnedOrganization) {
    return { granted: false };
  }

  const existing = await autumn.check({
    customerId: organizationId,
    featureId: FEATURES.AI_CREDITS,
  });
  if (existing.balance != null) {
    return { granted: false };
  }

  await autumn.balances.create({
    balanceId: `${SIGNUP_CREDITS_BALANCE_PREFIX}-${organizationId}`,
    customerId: organizationId,
    featureId: FEATURES.AI_CREDITS,
    includedGrant: SIGNUP_CREDITS_GRANT_CENTS,
  });
  return { granted: true };
}
