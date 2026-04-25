import {
  createBrandAnalysisJob,
  createBrandAnalysisJobId,
  setBrandAnalysisJobStatus,
  updateBrandAnalysisJob,
} from "@notra/ai/jobs/brand-analysis";
import { db } from "@notra/db/drizzle";
import { brandSettings } from "@notra/db/schema";
import { Client as WorkflowClient } from "@upstash/workflow";
import { and, eq } from "drizzle-orm";
import { redis } from "@/lib/redis";
import { getConfiguredWorkflowUrl } from "@/utils/url";

const DEFAULT_BRAND_CONSTRAINT = "brandSettings_org_default_uidx";

function isDefaultBrandConstraintViolation(error: unknown) {
  if (!(typeof error === "object" && error !== null)) {
    return false;
  }
  const candidates: unknown[] = [error];
  if ("cause" in error) {
    candidates.push((error as { cause: unknown }).cause);
  }
  return candidates.some((candidate) => {
    if (!(typeof candidate === "object" && candidate !== null)) {
      return false;
    }
    if (
      "constraint_name" in candidate &&
      candidate.constraint_name === DEFAULT_BRAND_CONSTRAINT
    ) {
      return true;
    }
    if (
      "constraint" in candidate &&
      candidate.constraint === DEFAULT_BRAND_CONSTRAINT
    ) {
      return true;
    }
    if (candidate instanceof Error) {
      return candidate.message.includes(DEFAULT_BRAND_CONSTRAINT);
    }
    return false;
  });
}

async function insertBrandIdentity({
  organizationId,
  brandName,
  websiteUrl,
}: {
  organizationId: string;
  brandName: string;
  websiteUrl: string;
}): Promise<{ id: string }> {
  const hasAnyBrandIdentity = await db.query.brandSettings.findFirst({
    where: eq(brandSettings.organizationId, organizationId),
    columns: { id: true },
  });

  const baseValues = {
    id: crypto.randomUUID(),
    organizationId,
    name: brandName,
    websiteUrl,
  };

  try {
    const [row] = await db
      .insert(brandSettings)
      .values({ ...baseValues, isDefault: !hasAnyBrandIdentity })
      .returning({ id: brandSettings.id });
    if (row) {
      return row;
    }
  } catch (error) {
    if (!isDefaultBrandConstraintViolation(error)) {
      throw error;
    }
  }

  const [fallback] = await db
    .insert(brandSettings)
    .values({ ...baseValues, id: crypto.randomUUID(), isDefault: false })
    .returning({ id: brandSettings.id });

  if (!fallback) {
    throw new Error("Failed to create brand identity");
  }
  return fallback;
}

interface QueueBrandAnalysisInput {
  organizationId: string;
  websiteUrl: string;
  name?: string;
}

interface QueueBrandAnalysisResult {
  jobId: string;
  brandIdentityId: string;
}

export async function queueBrandAnalysisForOnboarding({
  organizationId,
  websiteUrl,
  name,
}: QueueBrandAnalysisInput): Promise<QueueBrandAnalysisResult | null> {
  const token = process.env.QSTASH_TOKEN;
  const workflowBaseUrl = getConfiguredWorkflowUrl();

  if (!(redis && token && workflowBaseUrl)) {
    return null;
  }

  const now = new Date().toISOString();
  const jobId = createBrandAnalysisJobId();
  const brandName = name?.trim() || "Untitled Brand Voice";

  const brandIdentity = await insertBrandIdentity({
    organizationId,
    brandName,
    websiteUrl,
  });

  try {
    const job = await createBrandAnalysisJob(redis, {
      id: jobId,
      organizationId,
      brandIdentityId: brandIdentity.id,
      status: "queued",
      step: null,
      currentStep: 0,
      totalSteps: 3,
      workflowRunId: null,
      error: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    });

    const client = new WorkflowClient({ token });
    const result = await client.trigger({
      url: `${workflowBaseUrl}/api/workflows/brand-analysis`,
      body: {
        organizationId,
        url: websiteUrl,
        voiceId: brandIdentity.id,
        jobId,
      },
    });

    await updateBrandAnalysisJob(redis, jobId, {
      workflowRunId: result.workflowRunId,
    });

    return { jobId: job.id, brandIdentityId: brandIdentity.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to trigger workflow";

    await setBrandAnalysisJobStatus(redis, jobId, "failed", {
      step: null,
      currentStep: 0,
      totalSteps: 3,
      error: message,
    });

    await db
      .delete(brandSettings)
      .where(
        and(
          eq(brandSettings.id, brandIdentity.id),
          eq(brandSettings.organizationId, organizationId)
        )
      );

    throw error;
  }
}
