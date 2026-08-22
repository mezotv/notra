import { acquireClaim, releaseClaim } from "@notra/ai/autonomy/claims";
import type { BrandGuidelinesWorkflowPayload } from "@notra/ai/types/brand-guidelines";
import type { OnboardingAgentWorkflowPayload } from "@notra/ai/types/onboarding-agent";
import { contentGenerationWorkflowPayloadSchema } from "@notra/content-generation/schemas";
import { start } from "workflow/api";
import {
  IRIS_START_CLAIM_SCOPE,
  IRIS_START_CLAIM_TTL_SECONDS,
} from "@/constants/iris";
import { socialAnalyticsSyncPayloadSchema } from "@/schemas/analytics";
import { brandGuidelinesWorkflowPayloadSchema } from "@/schemas/brand-guidelines";
import {
  geoOrganizationInputSchema,
  geoWriterWorkflowPayloadSchema,
} from "@/schemas/geo";
import { gscSyncPayloadSchema } from "@/schemas/google-search-console";
import {
  eventWorkflowPayloadSchema,
  scheduleWorkflowPayloadSchema,
} from "@/schemas/workflows";
import {
  type IrisWorkflowPayload,
  irisWorkflowPayloadSchema,
} from "@/schemas/workflows/iris";
import { onboardingAgentWorkflowPayloadSchema } from "@/schemas/workflows/onboarding-agent-payload";
import type { BrandAnalysisPayload } from "@/types/brand-analysis";
import type { GeoWriterPayload } from "@/types/geo";
import type { GscSyncPayload } from "@/types/google-search-console";
import {
  brandAnalysisPayloadSchema,
  brandAnalysisWorkflow,
} from "@/workflows/brand-analysis";
import { brandGuidelinesWorkflow } from "@/workflows/brand-guidelines";
import { eventContentWorkflow } from "@/workflows/event-content";
import { geoScanWorkflow } from "@/workflows/geo-scan";
import { geoWriterWorkflow } from "@/workflows/geo-writer";
import { gscSyncWorkflow } from "@/workflows/gsc-sync";
import { irisControllerRun } from "@/workflows/iris-controller";
import { onDemandContentWorkflow } from "@/workflows/on-demand-content";
import { onboardingAgentWorkflow } from "@/workflows/onboarding-agent";
import { scheduleContentWorkflow } from "@/workflows/schedule-content";
import { socialAnalyticsSyncWorkflow } from "@/workflows/social-analytics-sync";

export async function startBrandAnalysisRun(
  payload: BrandAnalysisPayload
): Promise<{ runId: string }> {
  const parsed = brandAnalysisPayloadSchema.parse(payload);
  const run = await start(brandAnalysisWorkflow, [parsed]);
  return { runId: run.runId };
}

export async function startBrandGuidelinesRun(
  payload: BrandGuidelinesWorkflowPayload
): Promise<{ runId: string }> {
  const parsed = brandGuidelinesWorkflowPayloadSchema.parse(payload);
  const run = await start(brandGuidelinesWorkflow, [parsed]);
  return { runId: run.runId };
}

export async function startOnboardingAgentRun(
  payload: OnboardingAgentWorkflowPayload
): Promise<{ runId: string }> {
  const parsed = onboardingAgentWorkflowPayloadSchema.parse(payload);
  const run = await start(onboardingAgentWorkflow, [parsed]);
  return { runId: run.runId };
}

export async function startIrisRun(
  payload: IrisWorkflowPayload
): Promise<{ runId: string | null }> {
  const parsed = irisWorkflowPayloadSchema.parse(payload);
  const dispatchToken = crypto.randomUUID();
  const dispatch = await acquireClaim({
    scope: IRIS_START_CLAIM_SCOPE,
    claimKey: parsed.executionId,
    ownerToken: dispatchToken,
    ttlSeconds: IRIS_START_CLAIM_TTL_SECONDS,
    organizationId: parsed.organizationId,
  });
  if (!dispatch.claimed) {
    return { runId: null };
  }
  try {
    const run = await start(irisControllerRun, [parsed]);
    return { runId: run.runId };
  } catch (error) {
    await releaseClaim({
      scope: IRIS_START_CLAIM_SCOPE,
      claimKey: parsed.executionId,
      ownerToken: dispatchToken,
    });
    throw error;
  }
}

export async function startScheduleRun(payload: {
  triggerId: string;
  manual?: boolean;
  executionId?: string;
  delaySeconds?: number;
}): Promise<{ runId: string }> {
  const parsed = scheduleWorkflowPayloadSchema.parse(payload);
  const run = await start(scheduleContentWorkflow, [parsed]);
  return { runId: run.runId };
}

export async function startEventRun(payload: {
  triggerId: string;
  eventType: string;
  eventAction: string;
  eventData: Record<string, unknown>;
  repositoryId: string;
  deliveryId?: string;
  executionId?: string;
}): Promise<{ runId: string }> {
  const parsed = eventWorkflowPayloadSchema.parse(payload);
  const run = await start(eventContentWorkflow, [parsed]);
  return { runId: run.runId };
}

export async function startSocialAnalyticsSyncRun(payload: {
  organizationId?: string;
}): Promise<{ runId: string }> {
  const parsed = socialAnalyticsSyncPayloadSchema.parse(payload);
  const run = await start(socialAnalyticsSyncWorkflow, [parsed]);
  return { runId: run.runId };
}

export async function startGeoScanRun(payload: {
  organizationId: string;
  projectId?: string;
}): Promise<{ runId: string }> {
  const parsed = geoOrganizationInputSchema.parse(payload);
  const run = await start(geoScanWorkflow, [parsed]);
  return { runId: run.runId };
}

export async function startGeoWriterRun(
  payload: GeoWriterPayload
): Promise<{ runId: string }> {
  const parsed = geoWriterWorkflowPayloadSchema.parse(payload);
  const run = await start(geoWriterWorkflow, [parsed]);
  return { runId: run.runId };
}

export async function startGscSyncRun(
  payload: GscSyncPayload
): Promise<{ runId: string }> {
  const parsed = gscSyncPayloadSchema.parse(payload);
  const run = await start(gscSyncWorkflow, [parsed]);
  return { runId: run.runId };
}

export async function startOnDemandRun(
  payload: unknown
): Promise<{ runId: string }> {
  const parsed = contentGenerationWorkflowPayloadSchema.parse(payload);
  const run = await start(onDemandContentWorkflow, [parsed]);
  return { runId: run.runId };
}
