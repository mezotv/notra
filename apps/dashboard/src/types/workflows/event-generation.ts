import type {
  ScheduleBrandSettingsData,
  WorkflowRepositoryData,
  WorkflowTriggerData,
} from "@/types/workflows/workflows";

export interface EventGenerationStepInput {
  trigger: WorkflowTriggerData;
  repository: WorkflowRepositoryData;
  brand: ScheduleBrandSettingsData;
  collectionId: string;
  eventType: string;
  eventAction: string;
  eventData: Record<string, unknown>;
  chargeAiCredits?: boolean;
}

export type EventContentWorkflowResult =
  | { status: "success"; triggerId: string; postId: string; eventType: string }
  | { status: "duplicate_execution" }
  | { status: "invalid_payload" }
  | { status: "trigger_not_found" }
  | { status: "trigger_disabled" }
  | { status: "credits_exhausted" }
  | { status: "repository_not_found" }
  | { status: "unsupported_output_type" }
  | { status: "generation_failed"; reason: string }
  | { status: "skipped"; reason: string }
  | { status: "empty_result" };
