import { db } from "@notra/db/drizzle";
import { geoAgentReadinessReports } from "@notra/db/schema";
import { GEO_SCAN_NO_RESULTS_RETRY_DELAY } from "@notra/geo-core/constants/geo";
import { POSTHOG_EVENTS } from "@notra/posthog/events";
import { eq } from "drizzle-orm";

import { agentReadinessErrorKind } from "@/lib/analytics/geo-server-events";
import { trackServerEventAndFlush } from "@/lib/analytics/posthog-server";
import type {
  AgentReadinessScanTrackInput,
  GeoScanFailureTrackInput,
  GeoScanStepTrackInput,
  GeoWriterCompletedTrackInput,
  GeoWriterFailedTrackInput,
} from "@/types/analytics/geo-events";

function mentionRate(checks: number, mentions: number): number | null {
  return checks > 0 ? mentions / checks : null;
}

function durationSince(startedAt: Date | null): number | null {
  return startedAt ? Math.max(0, Date.now() - startedAt.getTime()) : null;
}

export async function trackGeoScanStepResult({
  organizationId,
  projectId,
  scanId,
  result,
  durationMs,
  retried,
}: GeoScanStepTrackInput): Promise<void> {
  const base = {
    organizationId,
    projectId: projectId ?? null,
  };
  if (result.status === "retry_no_successful_checks") {
    await trackServerEventAndFlush({
      ...base,
      event: POSTHOG_EVENTS.GEO_SCAN_RETRY_SCHEDULED,
      properties: {
        scan_id: scanId ?? null,
        delay: GEO_SCAN_NO_RESULTS_RETRY_DELAY,
        checks_total: result.checks,
        retry_project_count: result.retryProjectIds.length,
        duration_ms: durationMs,
      },
    });
    return;
  }
  if (result.status === "skipped" || result.status === "invalid_payload") {
    await trackServerEventAndFlush({
      ...base,
      event: POSTHOG_EVENTS.GEO_SCAN_SKIPPED,
      properties: {
        scan_id: scanId ?? null,
        reason: result.status,
        duration_ms: durationMs,
        retried,
      },
    });
    return;
  }
  const checks = result.checks ?? 0;
  const mentions = result.mentions ?? 0;
  await trackServerEventAndFlush({
    ...base,
    event: POSTHOG_EVENTS.GEO_SCAN_COMPLETED,
    properties: {
      scan_id: scanId ?? null,
      checks_total: checks,
      mentions,
      mention_rate: mentionRate(checks, mentions),
      duration_ms: durationMs,
      retried,
    },
  });
}

export async function trackGeoScanFailure({
  organizationId,
  projectId,
  scanId,
  reason,
  durationMs,
  retried,
}: GeoScanFailureTrackInput): Promise<void> {
  await trackServerEventAndFlush({
    organizationId,
    projectId: projectId ?? null,
    event: POSTHOG_EVENTS.GEO_SCAN_FAILED,
    properties: {
      scan_id: scanId ?? null,
      reason,
      duration_ms: durationMs,
      retried,
    },
  });
}

export async function trackGeoWriterCompleted({
  organizationId,
  projectId,
  briefId,
  runId,
  postId,
  humanized,
  startedAt,
}: GeoWriterCompletedTrackInput): Promise<void> {
  await trackServerEventAndFlush({
    organizationId,
    projectId,
    event: POSTHOG_EVENTS.GEO_WRITER_COMPLETED,
    properties: {
      brief_id: briefId,
      run_id: runId,
      post_id: postId,
      humanized,
      duration_ms: durationSince(startedAt),
    },
  });
}

export async function trackGeoWriterFailed({
  organizationId,
  projectId,
  briefId,
  runId,
  reason,
  startedAt,
}: GeoWriterFailedTrackInput): Promise<void> {
  await trackServerEventAndFlush({
    organizationId,
    projectId,
    event: POSTHOG_EVENTS.GEO_WRITER_FAILED,
    properties: {
      brief_id: briefId,
      run_id: runId,
      reason,
      duration_ms: durationSince(startedAt),
    },
  });
}

export async function trackAgentReadinessScanResult({
  payload,
  status,
  reason,
  durationMs,
}: AgentReadinessScanTrackInput): Promise<void> {
  const base = {
    organizationId: payload.organizationId,
    projectId: payload.projectId,
  };
  if (status === "completed") {
    const report = await db.query.geoAgentReadinessReports
      .findFirst({
        columns: { score: true, eligibleChecks: true },
        where: eq(geoAgentReadinessReports.id, payload.reportId),
      })
      .catch(() => undefined);
    await trackServerEventAndFlush({
      ...base,
      event: POSTHOG_EVENTS.AGENT_READINESS_SCAN_COMPLETED,
      properties: {
        report_id: payload.reportId,
        score: report?.score ?? null,
        check_count: report?.eligibleChecks ?? null,
        duration_ms: durationMs,
      },
    });
    return;
  }
  await trackServerEventAndFlush({
    ...base,
    event: POSTHOG_EVENTS.AGENT_READINESS_SCAN_FAILED,
    properties: {
      report_id: payload.reportId,
      error_kind:
        status === "invalid_payload" ? status : agentReadinessErrorKind(reason),
      duration_ms: durationMs,
    },
  });
}
