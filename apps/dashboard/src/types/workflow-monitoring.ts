import type { getWorld } from "workflow/runtime";

export type MonitoringWorld = Awaited<ReturnType<typeof getWorld>>;

export interface WorkflowTelemetryEvent extends Record<string, unknown> {
  event:
    | "job.queued"
    | "job.completed"
    | "job.failed"
    | "job.snapshot"
    | "job.step.snapshot"
    | "monitoring.sweep.completed"
    | "backend.dependency.checked";
  outcome?: "success" | "error";
  runId?: string;
  organizationId?: string | null;
  projectId?: string | null;
}

export interface WorkflowMonitoringSummary {
  sweepId: string;
  runs: number;
  pendingRuns: number;
  runningRuns: number;
  steps: number;
  activeTruncated: boolean;
  terminalTruncated: boolean;
  stepsTruncated: boolean;
  statusesChecked: number;
  errors: number;
  budgetExceeded: boolean;
}
