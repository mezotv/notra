import type { ContentGenerationWorkflowPayload } from "@notra/content-generation/schemas";

import type { WorkflowLifecycleFields } from "@/types/analytics/workflow-events";
import type {
  ScheduleBrandSettingsData,
  ScheduleRepositoryData,
} from "@/types/workflows/workflows";

export interface OnDemandJobEventInput {
  type:
    | "running"
    | "fetching_repositories"
    | "generating_content"
    | "post_created"
    | "completed"
    | "failed"
    | "skipped";
}

export interface FinishOnDemandInput extends WorkflowLifecycleFields {
  organizationId: string;
  runId: string;
  contentType: string;
  status: "success" | "failed" | "skipped";
  reason?: string;
  title?: string;
  source: "api" | "dashboard";
  jobId?: string;
  primaryPostId?: string;
  postCount?: number;
}

export interface OnDemandGenerationStepInput {
  payload: ContentGenerationWorkflowPayload;
  repositories: ScheduleRepositoryData[];
  brand: ScheduleBrandSettingsData;
  hasLinearSources: boolean;
  chargeAiCredits?: boolean;
}

export type OnDemandContentWorkflowResult =
  | { status: "success"; postId?: string }
  | { status: "duplicate_execution" }
  | { status: "invalid_payload" }
  | { status: "no_sources" }
  | { status: "credits_exhausted" }
  | { status: "generation_failed"; reason: string }
  | { status: "skipped"; reason: string }
  | { status: "empty_result" };
