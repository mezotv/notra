"use server";

import { redis } from "@notra/ai/utils/redis";
import { db } from "@notra/db/drizzle";
import { brandSettings, members, organizations } from "@notra/db/schema";
import { ORPCError } from "@orpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { Effect } from "effect";
import { headers } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { getAuthSession } from "@/lib/auth/server";
import { queueBrandAnalysisForOnboarding } from "@/lib/brand-analysis";
import { warmGeoOnboardingCache } from "@/lib/geo/onboarding";
import {
  resolveCompanyDomain,
  resolveReachableWebsiteUrl,
} from "@/lib/onboarding/company-domain";
import {
  ensureDefaultBrandIdentity,
  launchReservedOnboardingAgent,
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
  OnboardingAgentSetupTaskInput,
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

async function runOnboardingAgentSetup({
  domain,
  email,
  organizationId,
}: OnboardingAgentSetupTaskInput) {
  const websiteUrl = await resolveReachableWebsiteUrl(domain);
  if (!websiteUrl) {
    return;
  }

  const organization = await db.query.organizations.findFirst({
    columns: { name: true },
    where: eq(organizations.id, organizationId),
  });
  if (!organization) {
    throw new Error("Organization not found");
  }

  await ensureDefaultBrandIdentity({
    companyName: organization.name,
    organizationId,
    websiteUrl,
  });

  const reservedAt = await reserveInitialOnboardingAgentRun(organizationId);
  if (!reservedAt) {
    return;
  }

  await Effect.runPromise(
    launchReservedOnboardingAgent({
      payload: {
        domain,
        email,
        organizationId,
        organizationName: organization.name,
      },
      reservedAt,
    })
  );
}

export async function triggerOnboardingBrandAnalysis(
  rawInput: OnboardingBrandAnalysisInput
) {
  const input = onboardingBrandAnalysisSchema.parse(rawInput);
  const session = await getAuthSession();

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

  after(() => warmGeoOnboardingCache(input.organizationId, input.websiteUrl));

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
  const session = await getAuthSession();

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

  const taskInput: OnboardingAgentSetupTaskInput = {
    domain: resolution.domain,
    email: session.user.email,
    organizationId: input.organizationId,
  };

  after(async () => {
    try {
      await runOnboardingAgentSetup(taskInput);
    } catch (error) {
      console.error("[Onboarding] Background onboarding agent setup failed", {
        error,
        organizationId: taskInput.organizationId,
      });
    }
  });

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
