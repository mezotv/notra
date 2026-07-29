import type { BrandGuidelinesWorkflowPayload } from "@notra/ai/types/brand-guidelines";
import type { OnboardingAgentWorkflowPayload } from "@notra/ai/types/onboarding-agent";
import { contentGenerationWorkflowPayloadSchema } from "@notra/content-generation/schemas";
import { start } from "workflow/api";
import { brandGuidelinesWorkflowPayloadSchema } from "@/schemas/brand-guidelines";
import {
  eventWorkflowPayloadSchema,
  scheduleWorkflowPayloadSchema,
} from "@/schemas/workflows";
import { onboardingAgentWorkflowPayloadSchema } from "@/schemas/workflows/onboarding-agent-payload";
import type { BrandAnalysisPayload } from "@/types/brand-analysis";
import {
  brandAnalysisPayloadSchema,
  brandAnalysisWorkflow,
} from "@/workflows/brand-analysis";
import { brandGuidelinesWorkflow } from "@/workflows/brand-guidelines";
import { eventContentWorkflow } from "@/workflows/event-content";
import { onDemandContentWorkflow } from "@/workflows/on-demand-content";
import { onboardingAgentWorkflow } from "@/workflows/onboarding-agent";
import { scheduleContentWorkflow } from "@/workflows/schedule-content";

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

export async function startOnDemandRun(
  payload: unknown
): Promise<{ runId: string }> {
  const parsed = contentGenerationWorkflowPayloadSchema.parse(payload);
  const run = await start(onDemandContentWorkflow, [parsed]);
  return { runId: run.runId };
}
