import { parseStepName, parseWorkflowName } from "workflow/observability";

import {
  MONITORED_WORKFLOW_STATUSES,
  MONITORED_WORKFLOW_NAMES,
  WORKFLOW_MONITORING,
} from "@/constants/workflow-monitoring";
import type {
  MonitoringWorld,
  WorkflowMonitoringSummary,
} from "@/types/workflow-monitoring";
import { withMonitoringTimeout } from "@/utils/monitoring-timeout";
import { logWorkflowTelemetry } from "@/utils/workflow-telemetry";

export async function collectWorkflowMonitoring(world: MonitoringWorld) {
  const observedAt = Date.now();
  const summary: WorkflowMonitoringSummary = {
    sweepId: crypto.randomUUID(),
    runs: 0,
    pendingRuns: 0,
    runningRuns: 0,
    steps: 0,
    activeTruncated: false,
    terminalTruncated: false,
    stepsTruncated: false,
    statusesChecked: 0,
    errors: 0,
    budgetExceeded: false,
  };
  const stepRuns = new Map<string, string>();
  const seenRuns = new Set<string>();

  for (const status of MONITORED_WORKFLOW_STATUSES) {
    const active = status === "pending" || status === "running";
    let cursor: string | undefined;
    try {
      for (let page = 0; page < WORKFLOW_MONITORING.pagesPerStatus; page++) {
        if (Date.now() - observedAt >= WORKFLOW_MONITORING.sweepBudgetMs) {
          summary.budgetExceeded = true;
          break;
        }
        const result = await withMonitoringTimeout(
          world.runs.list({
            status,
            resolveData: "none",
            pagination: {
              cursor,
              limit: WORKFLOW_MONITORING.pageSize,
              sortOrder: active ? "asc" : "desc",
            },
          })
        );
        for (const run of result.data) {
          if (seenRuns.has(run.runId)) {
            continue;
          }
          seenRuns.add(run.runId);
          if (
            !active &&
            (!run.completedAt ||
              run.completedAt.getTime() <
                observedAt - WORKFLOW_MONITORING.recentTerminalMs)
          ) {
            continue;
          }
          const workflowName =
            parseWorkflowName(run.workflowName)?.shortName ?? run.workflowName;
          const workflow =
            MONITORED_WORKFLOW_NAMES[workflowName] ?? workflowName;
          logWorkflowTelemetry({
            event: "job.snapshot",
            sweepId: summary.sweepId,
            runId: run.runId,
            workflow,
            jobStatus: run.status,
            createdAt: run.createdAt.toISOString(),
            startedAt: run.startedAt?.toISOString(),
            completedAt: run.completedAt?.toISOString(),
            updatedAt: run.updatedAt.toISOString(),
            queueWaitMs: Math.max(
              0,
              (run.startedAt?.getTime() ??
                run.completedAt?.getTime() ??
                observedAt) - run.createdAt.getTime()
            ),
            durationMs: run.startedAt
              ? Math.max(
                  0,
                  (run.completedAt?.getTime() ?? observedAt) -
                    run.startedAt.getTime()
                )
              : undefined,
            errorCode: run.error?.code,
          });
          summary.runs++;
          if (run.status === "pending") {
            summary.pendingRuns++;
          } else if (run.status === "running") {
            summary.runningRuns++;
          }
          if (
            run.status !== "pending" &&
            stepRuns.size < WORKFLOW_MONITORING.stepRunLimit
          ) {
            stepRuns.set(run.runId, workflow);
          }
        }
        if (!result.hasMore) {
          break;
        }
        if (!result.cursor || page + 1 === WORKFLOW_MONITORING.pagesPerStatus) {
          if (active) {
            summary.activeTruncated = true;
          } else {
            summary.terminalTruncated = true;
          }
          break;
        }
        cursor = result.cursor;
      }
      if (!summary.budgetExceeded) {
        summary.statusesChecked++;
      }
    } catch {
      summary.errors++;
    }
    if (summary.budgetExceeded) {
      break;
    }
  }

  for (const [runId, workflow] of stepRuns) {
    if (Date.now() - observedAt >= WORKFLOW_MONITORING.sweepBudgetMs) {
      summary.budgetExceeded = true;
      break;
    }
    try {
      const result = await withMonitoringTimeout(
        world.steps.list({
          runId,
          resolveData: "none",
          pagination: {
            limit: WORKFLOW_MONITORING.stepsPerRun,
            sortOrder: "desc",
          },
        })
      );
      summary.stepsTruncated ||= result.hasMore;
      for (const step of result.data) {
        logWorkflowTelemetry({
          event: "job.step.snapshot",
          sweepId: summary.sweepId,
          runId,
          workflow,
          stepId: step.stepId,
          step: parseStepName(step.stepName)?.shortName ?? step.stepName,
          stepStatus: step.status,
          attempt: step.attempt,
          updatedAt: step.updatedAt.toISOString(),
          retryAfter: step.retryAfter?.toISOString(),
          durationMs: step.startedAt
            ? Math.max(
                0,
                (step.completedAt?.getTime() ?? observedAt) -
                  step.startedAt.getTime()
              )
            : undefined,
          errorCode: step.error?.code,
        });
        summary.steps++;
      }
    } catch {
      summary.errors++;
    }
  }

  logWorkflowTelemetry({
    event: "monitoring.sweep.completed",
    ...summary,
    durationMs: Date.now() - observedAt,
    outcome: summary.errors > 0 || summary.budgetExceeded ? "error" : "success",
  });
  return summary;
}
