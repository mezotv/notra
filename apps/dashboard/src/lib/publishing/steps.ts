import type {
  ApprovalWorkflowSummary,
  WorkflowStepDraft,
} from "@/types/settings/publishing";
import { MAX_REQUIRED_APPROVALS, MIN_REQUIRED_APPROVALS } from "./constants";

function createStepKey(): string {
  return `step-${Math.random().toString(36).slice(2, 10)}`;
}

export function createStepDraft(reviewerAccessGroupId = ""): WorkflowStepDraft {
  return {
    key: createStepKey(),
    reviewerAccessGroupId,
    requiredApprovals: MIN_REQUIRED_APPROVALS,
    name: "",
  };
}

export function toStepDrafts(
  workflow: ApprovalWorkflowSummary | null
): WorkflowStepDraft[] {
  if (!workflow || workflow.steps.length === 0) {
    return [createStepDraft()];
  }

  return workflow.steps.map((step) => ({
    key: step.id,
    reviewerAccessGroupId: step.reviewerAccessGroup.id,
    requiredApprovals: step.requiredApprovals,
    name: step.name ?? "",
  }));
}

export function moveStep(
  steps: WorkflowStepDraft[],
  index: number,
  direction: -1 | 1
): WorkflowStepDraft[] {
  const target = index + direction;
  if (target < 0 || target >= steps.length) {
    return steps;
  }

  const next = [...steps];
  const current = next[index];
  const swapped = next[target];
  if (!(current && swapped)) {
    return steps;
  }

  next[index] = swapped;
  next[target] = current;

  return next;
}

export function clampRequiredApprovals(value: number): number {
  if (Number.isNaN(value)) {
    return MIN_REQUIRED_APPROVALS;
  }

  return Math.min(
    MAX_REQUIRED_APPROVALS,
    Math.max(MIN_REQUIRED_APPROVALS, Math.round(value))
  );
}

export function formatRequiredApprovals(count: number): string {
  return count === 1 ? "1 approval" : `${count} approvals`;
}

export function toStepPayload(steps: WorkflowStepDraft[]) {
  return steps.map((step) => ({
    reviewerAccessGroupId: step.reviewerAccessGroupId,
    requiredApprovals: clampRequiredApprovals(step.requiredApprovals),
    name: step.name.trim() === "" ? null : step.name.trim(),
  }));
}
