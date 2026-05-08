"use server";

import { db } from "@notra/db/drizzle";
import { members } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { queueBrandAnalysisForOnboarding } from "@/lib/brand-analysis";
import type { TriggerOnboardingBrandAnalysisInput } from "@/types/brand-analysis";

export async function triggerOnboardingBrandAnalysis({
  organizationId,
  websiteUrl,
  name,
}: TriggerOnboardingBrandAnalysisInput) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const membership = await db.query.members.findFirst({
    where: and(
      eq(members.userId, session.user.id),
      eq(members.organizationId, organizationId)
    ),
    columns: { id: true },
  });

  if (!membership) {
    throw new Error("Forbidden");
  }

  try {
    await queueBrandAnalysisForOnboarding({
      organizationId,
      websiteUrl,
      name,
    });
  } catch (error) {
    console.error("[Onboarding] Failed to queue brand analysis", {
      organizationId,
      error,
    });
    throw new Error(
      "Couldn't kick off the brand analysis. Please try again in a moment."
    );
  }

  return { success: true };
}
