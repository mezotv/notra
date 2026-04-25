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

  const brandIdentityId = crypto.randomUUID();
  const now = new Date().toISOString();
  const jobId = createBrandAnalysisJobId();
  const brandName = name?.trim() || "Untitled Brand Voice";

  const hasAnyBrandIdentity = await db.query.brandSettings.findFirst({
    where: eq(brandSettings.organizationId, organizationId),
    columns: { id: true },
  });

  const [brandIdentity] = await db
    .insert(brandSettings)
    .values({
      id: brandIdentityId,
      organizationId,
      name: brandName,
      isDefault: !hasAnyBrandIdentity,
      websiteUrl,
    })
    .returning({ id: brandSettings.id });

  if (!brandIdentity) {
    throw new Error("Failed to create brand identity");
  }

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
