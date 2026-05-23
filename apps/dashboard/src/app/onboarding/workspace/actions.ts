"use server";

import { redis } from "@notra/ai/utils/redis";
import { db } from "@notra/db/drizzle";
import { brandSettings, members } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { queueBrandAnalysisForOnboarding } from "@/lib/brand-analysis";
import type { TriggerOnboardingBrandAnalysisInput } from "@/types/brand-analysis";
import { ratelimit } from "@/utils/ratelimit";

const ANALYSIS_LOCK_TTL_SECONDS = 60;

async function tryAcquireBrandAnalysisLock(organizationId: string) {
  if (!redis) {
    return true;
  }

  const result = await redis.set(
    `onboarding:brand-analysis:lock:${organizationId}`,
    "1",
    {
      ex: ANALYSIS_LOCK_TTL_SECONDS,
      nx: true,
    }
  );

  return result === "OK";
}

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

  const { success: withinLimit } =
    await ratelimit.onboardingBrandAnalysis.limit(organizationId);

  if (!withinLimit) {
    throw new Error(
      "Too many onboarding brand analysis requests. Please try again shortly."
    );
  }

  const acquiredLock = await tryAcquireBrandAnalysisLock(organizationId);

  if (!acquiredLock) {
    throw new Error("Onboarding brand analysis is already in progress.");
  }

  const existingBrand = await db.query.brandSettings.findFirst({
    where: eq(brandSettings.organizationId, organizationId),
    columns: { id: true },
  });

  if (existingBrand) {
    throw new Error("Onboarding brand analysis has already been requested.");
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
