"use server";

import { triggerOnboardingAgent } from "@notra/ai/qstash/triggers";
import { redis } from "@notra/ai/utils/redis";
import { db } from "@notra/db/drizzle";
import { brandSettings, members, organizations } from "@notra/db/schema";
import { ORPCError } from "@orpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { auth } from "@/lib/auth/server";
import { queueBrandAnalysisForOnboarding } from "@/lib/brand-analysis";
import {
  isWebsiteReachable,
  resolveCompanyDomain,
} from "@/lib/onboarding/company-domain";
import {
  releaseOnboardingAgentReservation,
  reserveInitialOnboardingAgentRun,
} from "@/lib/onboarding-agent";
import { organizationIdSchema } from "@/schemas/auth/organization";
import {
  type OnboardingBrandAnalysisInput,
  onboardingBrandAnalysisSchema,
} from "@/schemas/brand-analysis";
import { onboardingWorkspaceAttributionSchema } from "@/schemas/onboarding/workspace";
import { triggerOnboardingAgentSetupSchema } from "@/schemas/onboarding-agent";
import type {
  SaveOnboardingAttributionInput,
  SaveOnboardingAttributionResult,
} from "@/types/onboarding";
import type {
  TriggerOnboardingAgentSetupInput,
  TriggerOnboardingAgentSetupResult,
} from "@/types/onboarding-agent";
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

export async function triggerOnboardingBrandAnalysis(
  rawInput: OnboardingBrandAnalysisInput
) {
  const input = onboardingBrandAnalysisSchema.parse(rawInput);
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const membership = await db.query.members.findFirst({
    where: and(
      eq(members.userId, session.user.id),
      eq(members.organizationId, input.organizationId)
    ),
    columns: { id: true },
  });

  if (!membership) {
    throw new Error("Forbidden");
  }

  const { success: withinLimit } =
    await ratelimit.onboardingBrandAnalysis.limit(input.organizationId);

  if (!withinLimit) {
    throw new Error(
      "Too many onboarding brand analysis requests. Please try again shortly."
    );
  }

  const acquiredLock = await tryAcquireBrandAnalysisLock(input.organizationId);

  if (!acquiredLock) {
    throw new Error("Onboarding brand analysis is already in progress.");
  }

  const existingBrand = await db.query.brandSettings.findFirst({
    where: eq(brandSettings.organizationId, input.organizationId),
    columns: { id: true },
  });

  if (existingBrand) {
    throw new Error("Onboarding brand analysis has already been requested.");
  }

  try {
    await queueBrandAnalysisForOnboarding({
      organizationId: input.organizationId,
      websiteUrl: input.websiteUrl,
      name: input.name,
    });
  } catch (error) {
    console.error("[Onboarding] Failed to queue brand analysis", {
      organizationId: input.organizationId,
      error,
    });
    throw new Error(
      "Couldn't kick off the brand analysis. Please try again in a moment."
    );
  }

  return { success: true };
}

export async function triggerOnboardingAgentSetup(
  rawInput: TriggerOnboardingAgentSetupInput
): Promise<TriggerOnboardingAgentSetupResult> {
  const input = triggerOnboardingAgentSetupSchema.parse(rawInput);
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const membership = await db.query.members.findFirst({
    where: and(
      eq(members.userId, session.user.id),
      eq(members.organizationId, input.organizationId)
    ),
    columns: { id: true },
  });

  if (!membership) {
    throw new Error("Forbidden");
  }

  const { success: withinLimit } = await ratelimit.onboardingAgent.limit(
    input.organizationId
  );

  if (!withinLimit) {
    throw new Error(
      "Too many onboarding agent requests. Please try again shortly."
    );
  }

  const resolution = resolveCompanyDomain({
    email: session.user.email,
    websiteUrl: input.websiteUrl,
  });
  if (!resolution) {
    return { skipped: "no-company-domain", success: true };
  }

  const reachable = await isWebsiteReachable(resolution.domain);
  if (!reachable) {
    return { skipped: "website-unreachable", success: true };
  }

  const reserved = await reserveInitialOnboardingAgentRun(input.organizationId);
  if (!reserved) {
    return { skipped: "already-started", success: true };
  }

  const organization = await db.query.organizations.findFirst({
    columns: { slug: true },
    where: eq(organizations.id, input.organizationId),
  });

  try {
    await triggerOnboardingAgent({
      domain: resolution.domain,
      email: session.user.email,
      organizationId: input.organizationId,
      organizationSlug: organization?.slug,
    });
  } catch (error) {
    await releaseOnboardingAgentReservation(input.organizationId);
    throw error;
  }

  return { success: true };
}

const saveOnboardingAttributionSchema = z
  .object({
    organizationId: organizationIdSchema,
  })
  .and(onboardingWorkspaceAttributionSchema);

export async function saveOnboardingAttribution(
  rawInput: SaveOnboardingAttributionInput
): Promise<SaveOnboardingAttributionResult> {
  const parsed = saveOnboardingAttributionSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid attribution details",
    };
  }

  let membershipRole: string;

  try {
    const access = await assertOrganizationAccess({
      headers: await headers(),
      organizationId: parsed.data.organizationId,
    });
    membershipRole = access.membership.role;
  } catch (error) {
    if (error instanceof ORPCError) {
      return {
        success: false,
        error: error.message,
      };
    }

    throw error;
  }

  if (membershipRole !== "owner") {
    return {
      success: false,
      error: "Only the organization owner can set this",
    };
  }

  if (
    !(parsed.data.heardAboutNotraSource || parsed.data.heardAboutNotraOther)
  ) {
    return { success: true };
  }

  await db
    .update(organizations)
    .set({
      heardAboutNotraSource: parsed.data.heardAboutNotraSource,
      heardAboutNotraOther: parsed.data.heardAboutNotraOther,
    })
    .where(
      and(
        eq(organizations.id, parsed.data.organizationId),
        isNull(organizations.heardAboutNotraSource),
        isNull(organizations.heardAboutNotraOther)
      )
    );

  return { success: true };
}
