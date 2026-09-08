import { db } from "@notra/db/drizzle";
import { brandSettings, geoAgentReadinessReports } from "@notra/db/schema";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { Effect, Layer } from "effect";

import {
  AGENT_READINESS_API_ORIGIN,
  AGENT_READINESS_HISTORY_LIMIT,
  AGENT_READINESS_HTTP_NOT_FOUND,
  AGENT_READINESS_REPORT_TIMEOUT_MS,
  AGENT_READINESS_SCAN_TIMEOUT_MS,
  AGENT_READINESS_USER_AGENT,
} from "../constants/agent-readiness";
import { GeoWorkflowService, AgentReadinessNetwork } from "../deps";
import {
  agentReadinessApiProblemSchema,
  agentReadinessApiReportSchema,
} from "../schemas/agent-readiness";
import {
  AgentReadinessApiError,
  AgentReadinessTargetMissingError,
  AgentReadinessClaimError,
  AgentReadinessStampError,
  AgentReadinessStartError,
} from "../schemas/agent-readiness-errors";
import type {
  AgentReadinessApiReport,
  AgentReadinessFetch,
  AgentReadinessHistoryPoint,
  AgentReadinessParsedReport,
  AgentReadinessReportView,
  AgentReadinessReportRow,
  AgentReadinessResponse,
  AgentReadinessScanResponse,
  AgentReadinessScope,
  AgentReadinessSseEvent,
  AgentReadinessSseFrameBoundary,
  AgentReadinessWorkflowPayload,
  AgentReadinessWorkflowResult,
} from "../types/agent-readiness";
import {
  canReuseAgentReadinessScan,
  toAgentReadinessApiErrorMessage,
} from "../utils/agent-readiness";
import { checkFeedbackMarkdown } from "../utils/feedback-md";
import {
  areWebsiteUrlsEquivalent,
  getWebsiteUrlLookupVariants,
  normalizeWebsiteUrl,
} from "../utils/geo-website";
import { geoDb } from "./effect";

function parseApiReport(
  body: AgentReadinessApiReport
): AgentReadinessParsedReport {
  const breakdown = body.score_breakdown;
  return {
    score: body.score ?? null,
    scoreLabel: body.score_label ?? null,
    scoreBreakdown: breakdown
      ? {
          essential: breakdown.essential,
          recommended: breakdown.recommended,
          bonus: {
            points: breakdown.bonus.points,
            positiveSignals: breakdown.bonus.positive_signals,
          },
        }
      : null,
    issues: (body.issues ?? []).map((issue) => ({
      id: issue.id,
      name: issue.name,
      tier: issue.tier,
      result: issue.result,
      details: issue.details ?? null,
      recommendation: issue.recommendation ?? null,
    })),
    eligibleChecks: body.eligible_checks ?? null,
    reportUrl: body.report_url ?? null,
    scannedAt: body.scanned_at ? new Date(body.scanned_at) : null,
  };
}

async function fetchStoredReport(
  targetUrl: string,
  signal: AbortSignal,
  fetchRequest: AgentReadinessFetch
): Promise<AgentReadinessParsedReport | null> {
  const endpoint = new URL("/api/v1/report", AGENT_READINESS_API_ORIGIN);
  endpoint.searchParams.set("url", targetUrl);
  const response = await fetchRequest(endpoint, {
    headers: {
      Accept: "application/json",
      "User-Agent": AGENT_READINESS_USER_AGENT,
    },
    signal: AbortSignal.any([
      signal,
      AbortSignal.timeout(AGENT_READINESS_REPORT_TIMEOUT_MS),
    ]),
  });

  if (response.status === AGENT_READINESS_HTTP_NOT_FOUND) {
    await response.text();
    return null;
  }
  if (!response.ok) {
    const parsedProblem = agentReadinessApiProblemSchema.safeParse(
      await response.json().catch(() => null)
    );
    throw new AgentReadinessApiError({
      message: toAgentReadinessApiErrorMessage(
        parsedProblem.success ? parsedProblem.data.code : null,
        targetUrl,
        response.status
      ),
    });
  }

  const parsed = agentReadinessApiReportSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new AgentReadinessApiError({
      message: "Is Agentic returned a report in an unexpected format",
    });
  }
  return parseApiReport(parsed.data);
}

function ssePayload(frame: string): unknown {
  const dataLines = frame
    .split(/\r\n|\n|\r/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trim());
  if (dataLines.length === 0) {
    return null;
  }
  try {
    return JSON.parse(dataLines.join("\n"));
  } catch {
    return null;
  }
}

function sseFrameBoundary(
  buffer: string
): AgentReadinessSseFrameBoundary | null {
  const match = /\r\n\r\n|\n\n|\r\r/.exec(buffer);
  return match?.index === undefined
    ? null
    : { index: match.index, length: match[0].length };
}

function assertScanFrameOk(frame: string): void {
  const event = ssePayload(frame);
  if (
    event &&
    typeof event === "object" &&
    (event as AgentReadinessSseEvent).type === "error"
  ) {
    throw new AgentReadinessApiError({
      message: "Is Agentic could not complete the scan for this website",
    });
  }
}

/**
 * Starts a scan and blocks until the SSE stream closes; is-agentic stores the
 * finished report server-side, so the stream is only consumed for completion.
 */
async function streamScan(
  targetUrl: string,
  signal: AbortSignal,
  fetchRequest: AgentReadinessFetch
): Promise<void> {
  const endpoint = new URL("/api/scan/stream", AGENT_READINESS_API_ORIGIN);
  endpoint.searchParams.set("target", targetUrl);
  const response = await fetchRequest(endpoint, {
    headers: {
      Accept: "text/event-stream",
      "Cache-Control": "no-store",
      "User-Agent": AGENT_READINESS_USER_AGENT,
    },
    signal: AbortSignal.any([
      signal,
      AbortSignal.timeout(AGENT_READINESS_SCAN_TIMEOUT_MS),
    ]),
  });

  if (!(response.ok && response.body)) {
    const parsedProblem = agentReadinessApiProblemSchema.safeParse(
      await response.json().catch(() => null)
    );
    throw new AgentReadinessApiError({
      message: toAgentReadinessApiErrorMessage(
        parsedProblem.success ? parsedProblem.data.code : null,
        targetUrl,
        response.status
      ),
    });
  }

  const reader = response.body.getReader();
  const cancel = () => {
    void reader.cancel().catch(() => undefined);
  };
  signal.addEventListener("abort", cancel, { once: true });
  const decoder = new TextDecoder();
  let buffer = "";
  let completed = false;
  try {
    if (signal.aborted) {
      cancel();
      signal.throwIfAborted();
    }
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        completed = true;
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      let boundary = sseFrameBoundary(buffer);
      while (boundary) {
        assertScanFrameOk(buffer.slice(0, boundary.index));
        buffer = buffer.slice(boundary.index + boundary.length);
        boundary = sseFrameBoundary(buffer);
      }
    }
    buffer += decoder.decode();
    if (buffer) {
      assertScanFrameOk(buffer);
    }
  } finally {
    signal.removeEventListener("abort", cancel);
    if (!completed) {
      await reader.cancel().catch(() => undefined);
    }
    reader.releaseLock();
  }
}

function toReportView(row: AgentReadinessReportRow): AgentReadinessReportView {
  return {
    id: row.id,
    status: row.status,
    targetUrl: row.targetUrl,
    score: row.score,
    scoreLabel: row.scoreLabel,
    scoreBreakdown: row.scoreBreakdown ?? null,
    issues: row.issues,
    eligibleChecks: row.eligibleChecks,
    reportUrl: row.reportUrl,
    errorMessage: row.errorMessage,
    scannedAt: row.scannedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

const resolveTargetUrl = Effect.fn("geo.agentReadiness.target")(function* (
  brandSettingsId: string
) {
  const brand = yield* geoDb("read readiness target", () =>
    db.query.brandSettings.findFirst({
      columns: { websiteUrl: true },
      where: eq(brandSettings.id, brandSettingsId),
    })
  );
  const targetUrl = brand?.websiteUrl
    ? normalizeWebsiteUrl(brand.websiteUrl)
    : null;
  if (!targetUrl) {
    return yield* Effect.fail(
      new AgentReadinessTargetMissingError({
        message: "Add a website URL in brand settings before scanning",
      })
    );
  }
  return targetUrl;
});

async function latestRowWhere(
  projectId: string,
  status?: AgentReadinessReportRow["status"],
  targetUrl?: string
): Promise<AgentReadinessReportRow | undefined> {
  const conditions = [eq(geoAgentReadinessReports.projectId, projectId)];
  if (status) {
    conditions.push(eq(geoAgentReadinessReports.status, status));
  }
  if (targetUrl) {
    conditions.push(
      inArray(
        geoAgentReadinessReports.targetUrl,
        getWebsiteUrlLookupVariants(targetUrl)
      )
    );
  }
  return await db.query.geoAgentReadinessReports.findFirst({
    where: and(...conditions),
    orderBy: desc(geoAgentReadinessReports.createdAt),
  });
}

async function loadHistory(
  projectId: string,
  targetUrl: string
): Promise<AgentReadinessHistoryPoint[]> {
  const rows = await db.query.geoAgentReadinessReports.findMany({
    columns: {
      id: true,
      score: true,
      issues: true,
      scannedAt: true,
      createdAt: true,
    },
    where: and(
      eq(geoAgentReadinessReports.projectId, projectId),
      inArray(
        geoAgentReadinessReports.targetUrl,
        getWebsiteUrlLookupVariants(targetUrl)
      ),
      eq(geoAgentReadinessReports.status, "completed")
    ),
    orderBy: desc(geoAgentReadinessReports.createdAt),
    limit: AGENT_READINESS_HISTORY_LIMIT,
  });
  return rows
    .map((row) => ({
      id: row.id,
      score: row.score,
      failedCount: row.issues.filter((issue) => issue.result === "failed")
        .length,
      partialCount: row.issues.filter((issue) => issue.result === "partial")
        .length,
      scannedAt: (row.scannedAt ?? row.createdAt).toISOString(),
    }))
    .reverse();
}

export const loadAgentReadiness = Effect.fn("geo.agentReadiness.load")(
  function* (scope: AgentReadinessScope) {
    const targetUrl = yield* resolveTargetUrl(scope.brandSettingsId);
    const [completed, latest, history] = yield* Effect.all(
      [
        geoDb("read completed readiness", () =>
          latestRowWhere(scope.projectId, "completed", targetUrl)
        ),
        geoDb("read latest readiness", () =>
          latestRowWhere(scope.projectId, undefined, targetUrl)
        ),
        geoDb("read readiness history", () =>
          loadHistory(scope.projectId, targetUrl)
        ),
      ],
      { concurrency: "unbounded" }
    );

    const report = completed ? toReportView(completed) : null;
    const scan =
      latest && latest.id !== completed?.id ? toReportView(latest) : null;
    return {
      targetUrl,
      report,
      scan,
      history,
    } satisfies AgentReadinessResponse;
  }
);

export const startAgentReadinessScan = Effect.fn("geo.agentReadiness.start")(
  function* (scope: AgentReadinessScope) {
    const workflows = yield* GeoWorkflowService;
    const claim = yield* Effect.gen(function* () {
      const [targetUrl, running] = yield* Effect.all([
        resolveTargetUrl(scope.brandSettingsId),
        geoDb("read running readiness", () =>
          latestRowWhere(scope.projectId, "running")
        ),
      ]);
      if (running && canReuseAgentReadinessScan(running, targetUrl)) {
        return {
          alreadyRunning: true as const,
          response: { reportId: running.id, alreadyRunning: true as const },
        };
      }

      if (running) {
        const targetChanged = !areWebsiteUrlsEquivalent(
          running.targetUrl,
          targetUrl
        );
        yield* geoDb("replace readiness scan", () =>
          db
            .update(geoAgentReadinessReports)
            .set({
              status: "failed",
              errorMessage: targetChanged
                ? "Scan replaced after the website URL changed."
                : "Scan timed out before completion.",
            })
            .where(
              and(
                eq(geoAgentReadinessReports.id, running.id),
                eq(geoAgentReadinessReports.status, "running")
              )
            )
        );
      }

      const reportId = crypto.randomUUID();
      const inserted = yield* geoDb("claim readiness scan", () =>
        db
          .insert(geoAgentReadinessReports)
          .values({
            id: reportId,
            organizationId: scope.organizationId,
            projectId: scope.projectId,
            targetUrl,
          })
          .onConflictDoNothing()
          .returning({ id: geoAgentReadinessReports.id })
      );
      if (inserted.length === 0) {
        const winner = yield* geoDb("read readiness claim winner", () =>
          latestRowWhere(scope.projectId, "running", targetUrl)
        );
        if (!winner || !canReuseAgentReadinessScan(winner, targetUrl)) {
          return yield* Effect.fail(
            new AgentReadinessClaimError({
              message: "Failed to claim agent readiness scan",
            })
          );
        }
        return {
          alreadyRunning: true as const,
          response: { reportId: winner.id, alreadyRunning: true as const },
        };
      }
      return { alreadyRunning: false as const, reportId, targetUrl };
    });

    if (claim.alreadyRunning) {
      return claim.response;
    }

    const response: AgentReadinessScanResponse = {
      reportId: claim.reportId,
      alreadyRunning: false,
    };
    return yield* workflows
      .startAgentReadinessRun({
        organizationId: scope.organizationId,
        projectId: scope.projectId,
        reportId: claim.reportId,
        targetUrl: claim.targetUrl,
      })
      .pipe(
        Effect.mapError((cause) => new AgentReadinessStartError({ cause })),
        Effect.map(() => response),
        Effect.catch((error) =>
          geoDb("stamp failed readiness handoff", () =>
            db
              .update(geoAgentReadinessReports)
              .set({
                status: "failed",
                errorMessage: "Scan could not be started. Please try again.",
              })
              .where(
                and(
                  eq(geoAgentReadinessReports.id, claim.reportId),
                  eq(geoAgentReadinessReports.status, "running")
                )
              )
          ).pipe(
            Effect.mapError(
              (stampCause) =>
                new AgentReadinessStampError({ cause: error, stampCause })
            ),
            Effect.andThen(Effect.fail(error))
          )
        )
      );
  }
);

async function latestCompletedBefore(
  projectId: string,
  targetUrl: string,
  excludeReportId: string
): Promise<AgentReadinessReportRow | undefined> {
  return await db.query.geoAgentReadinessReports.findFirst({
    where: and(
      eq(geoAgentReadinessReports.projectId, projectId),
      inArray(
        geoAgentReadinessReports.targetUrl,
        getWebsiteUrlLookupVariants(targetUrl)
      ),
      eq(geoAgentReadinessReports.status, "completed"),
      ne(geoAgentReadinessReports.id, excludeReportId)
    ),
    orderBy: desc(geoAgentReadinessReports.createdAt),
  });
}

/**
 * Reuses an already stored is-agentic report when it is newer than what we
 * have; otherwise runs a fresh scan. Mirrors the CLI: never forces a rescan
 * when the remote report is new to us.
 */
export const executeAgentReadinessScan = Effect.fn(
  "geo.agentReadiness.execute"
)(function* (payload: AgentReadinessWorkflowPayload) {
  const network = yield* AgentReadinessNetwork;
  return yield* Effect.gen(function* () {
    const previous = yield* geoDb("read previous readiness", () =>
      latestCompletedBefore(
        payload.projectId,
        payload.targetUrl,
        payload.reportId
      )
    );
    let report = yield* network.report(payload.targetUrl);
    const alreadySeen = Boolean(
      report?.scannedAt &&
      previous?.scannedAt &&
      report.scannedAt.getTime() <= previous.scannedAt.getTime()
    );
    if (!report || alreadySeen) {
      yield* network.scan(payload.targetUrl);
      report = yield* network.report(payload.targetUrl);
    }
    if (!report) {
      return yield* Effect.fail(
        new AgentReadinessApiError({
          message: "The scan finished without a stored report",
        })
      );
    }

    const feedbackMdIssue = yield* network.feedback(payload.targetUrl);
    const issues = feedbackMdIssue
      ? [...report.issues, feedbackMdIssue]
      : report.issues;

    const updated = yield* geoDb("complete readiness scan", () =>
      db
        .update(geoAgentReadinessReports)
        .set({
          status: "completed",
          score: report.score,
          scoreLabel: report.scoreLabel,
          scoreBreakdown: report.scoreBreakdown,
          // feedback.md is a Notra bonus check, so it does not alter the
          // externally owned Is Agentic score or breakdown.
          issues,
          eligibleChecks: report.eligibleChecks,
          reportUrl: report.reportUrl,
          errorMessage: null,
          scannedAt: report.scannedAt ?? new Date(),
        })
        .where(
          and(
            eq(geoAgentReadinessReports.id, payload.reportId),
            eq(geoAgentReadinessReports.organizationId, payload.organizationId),
            eq(geoAgentReadinessReports.projectId, payload.projectId),
            eq(geoAgentReadinessReports.targetUrl, payload.targetUrl),
            eq(geoAgentReadinessReports.status, "running")
          )
        )
        .returning({ id: geoAgentReadinessReports.id })
    );
    if (updated.length === 0) {
      return {
        status: "failed",
        reason: "Scan was replaced before completion.",
      } satisfies AgentReadinessWorkflowResult;
    }
    return { status: "completed" } satisfies AgentReadinessWorkflowResult;
  }).pipe(
    Effect.catch((error) =>
      Effect.gen(function* () {
        const reason =
          error instanceof AgentReadinessApiError
            ? error.message
            : "Scan failed. Please try again.";
        console.error("[AgentReadiness] Scan failed:", error);
        yield* geoDb("stamp failed readiness scan", () =>
          db
            .update(geoAgentReadinessReports)
            .set({ status: "failed", errorMessage: reason })
            .where(
              and(
                eq(geoAgentReadinessReports.id, payload.reportId),
                eq(
                  geoAgentReadinessReports.organizationId,
                  payload.organizationId
                ),
                eq(geoAgentReadinessReports.projectId, payload.projectId),
                eq(geoAgentReadinessReports.targetUrl, payload.targetUrl),
                eq(geoAgentReadinessReports.status, "running")
              )
            )
        ).pipe(
          Effect.mapError(
            (stampCause) =>
              new AgentReadinessStampError({ cause: error, stampCause })
          )
        );
        return {
          status: "failed",
          reason,
        } satisfies AgentReadinessWorkflowResult;
      })
    )
  );
});

function readinessNetwork<A>(run: (signal: AbortSignal) => Promise<A>) {
  return Effect.tryPromise({
    try: run,
    catch: (cause) =>
      cause instanceof AgentReadinessApiError
        ? cause
        : new AgentReadinessApiError({
            message: "Is Agentic could not be reached. Please try again.",
            cause,
          }),
  });
}

export function makeAgentReadinessNetwork(fetchRequest: AgentReadinessFetch) {
  return Layer.effect(
    AgentReadinessNetwork,
    Effect.sync(() =>
      AgentReadinessNetwork.of({
        report: Effect.fn("AgentReadinessNetwork.report")((url) =>
          readinessNetwork((signal) =>
            fetchStoredReport(url, signal, fetchRequest)
          )
        ),
        scan: Effect.fn("AgentReadinessNetwork.scan")((url) =>
          readinessNetwork((signal) => streamScan(url, signal, fetchRequest))
        ),
        feedback: Effect.fn("AgentReadinessNetwork.feedback")((url) =>
          readinessNetwork((signal) => checkFeedbackMarkdown(url, signal))
        ),
      })
    )
  );
}

export const agentReadinessNetworkLive = makeAgentReadinessNetwork(
  (url, init) => fetch(url, init)
);
