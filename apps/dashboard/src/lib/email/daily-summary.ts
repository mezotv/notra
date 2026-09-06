import { db } from "@notra/db/drizzle";
import {
  geoScans,
  geoSettings,
  members,
  organizationNotificationSettings,
  organizations,
  projects,
} from "@notra/db/schema";
import {
  queryGeoCheckOverview,
  queryGeoScanComparison,
  toGeoCheckWindow,
} from "@notra/db/utils/geo-checks";
import { EMAIL_CONFIG } from "@notra/email/utils/config";
import { engineEmailLogoSrc } from "@notra/email/utils/engine-logo";
import { getResend } from "@notra/email/utils/resend";
import { GEO_CHANGE_KIND_LABELS } from "@notra/geo-core/constants/geo";
import type { GeoChangeEvent, GeoChangeKind } from "@notra/geo-core/types/geo";
import {
  diffScanChecks,
  summarizeGeoChanges,
  toGeoScanCheckSnapshot,
} from "@notra/geo-core/utils/geo-changes";
import {
  engineFamilyLabel,
  engineFamilyOf,
} from "@notra/geo-core/utils/geo-engine-family";
import {
  and,
  asc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  lte,
  notExists,
  or,
} from "drizzle-orm";

import {
  DAILY_SUMMARY_MAX_ITEMS,
  DAILY_SUMMARY_PROMPT_MAX_LENGTH,
} from "@/constants/daily-summary";
import { hasGeoEntitlement } from "@/lib/billing/subscription";
import { sendDailySummaryEmail } from "@/lib/email/send";
import type {
  DailySummaryOrganizationResult,
  DailySummaryWindow,
} from "@/types/email/daily-summary";
import {
  aggregateMentionTotals,
  buildDailySummary,
  getCurrentUtcDayWindow,
  getPreviousUtcDayWindow,
  isQuietDailySummary,
  mergeChangesSummaries,
  truncatePrompt,
  utcDateKey,
} from "@/utils/daily-summary";

export interface DailySummaryCronResult {
  windowStart: string;
  windowEnd: string;
  organizationsConsidered: number;
  emailsSent: number;
  skippedQuiet: number;
  skippedUnentitled: number;
  skippedAlreadySent: number;
  failed: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Takes the once-per-day send lock for `windowStart` (a UTC day start).
 * Organizations without a settings row are opted in by default, so the row
 * is created on first claim with the same defaults the settings page shows.
 * Returns the previous stamp so a failed send can hand the lock back, or
 * `null` when the day was already claimed or the recap is switched off.
 */
async function claimDailySummaryDay(
  organizationId: string,
  windowStart: Date
): Promise<{ previousSentFor: Date | null } | null> {
  await db
    .insert(organizationNotificationSettings)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      scheduledContentCreation: false,
      scheduledContentFailed: false,
      scheduledContentSkipped: false,
      marketingEmails: true,
      dailySummary: true,
    })
    .onConflictDoNothing({
      target: organizationNotificationSettings.organizationId,
    });

  const current = await db.query.organizationNotificationSettings.findFirst({
    where: eq(organizationNotificationSettings.organizationId, organizationId),
    columns: { dailySummary: true, dailySummarySentFor: true },
  });
  if (!current?.dailySummary) {
    return null;
  }
  const previousSentFor = current.dailySummarySentFor;
  if (previousSentFor && previousSentFor >= windowStart) {
    return null;
  }

  // Compare-and-set on "not yet claimed for this day", so two scans finishing
  // at the same moment cannot both send: the first update moves the stamp to
  // `windowStart` and the second no longer matches.
  const claimed = await db
    .update(organizationNotificationSettings)
    .set({ dailySummarySentFor: windowStart })
    .where(
      and(
        eq(organizationNotificationSettings.organizationId, organizationId),
        eq(organizationNotificationSettings.dailySummary, true),
        or(
          isNull(organizationNotificationSettings.dailySummarySentFor),
          lt(organizationNotificationSettings.dailySummarySentFor, windowStart)
        )
      )
    )
    .returning({ id: organizationNotificationSettings.id });

  return claimed.length > 0 ? { previousSentFor } : null;
}

async function releaseDailySummaryDay(
  organizationId: string,
  windowStart: Date,
  previousSentFor: Date | null
) {
  await db
    .update(organizationNotificationSettings)
    .set({ dailySummarySentFor: previousSentFor })
    .where(
      and(
        eq(organizationNotificationSettings.organizationId, organizationId),
        eq(organizationNotificationSettings.dailySummarySentFor, windowStart)
      )
    );
}

/**
 * Projects of the organization that are still expected to scan inside the
 * window: scans enabled, due before the window closes, and no completed scan
 * in the window yet. The sweep advances `next_scan_at` before a scan starts,
 * so a project scanning right now is not counted as pending; a project that
 * is only due tomorrow is not either.
 */
async function countProjectsStillDueInWindow(
  organizationId: string,
  window: DailySummaryWindow
): Promise<number> {
  const windowClose = new Date(window.start.getTime() + MS_PER_DAY);
  const rows = await db
    .select({ projectId: geoSettings.projectId })
    .from(geoSettings)
    .where(
      and(
        eq(geoSettings.organizationId, organizationId),
        eq(geoSettings.enabled, true),
        lte(geoSettings.nextScanAt, windowClose),
        notExists(
          db
            .select({ id: geoScans.id })
            .from(geoScans)
            .where(
              and(
                eq(geoScans.projectId, geoSettings.projectId),
                eq(geoScans.status, "completed"),
                gte(geoScans.finishedAt, window.start),
                lt(geoScans.finishedAt, window.end)
              )
            )
        )
      )
    );
  return rows.length;
}

/**
 * Sends the organization's recap right after one of its scans completed,
 * instead of waiting for the morning cron. Holds off while other projects of
 * the organization are still due today, so the recap covers the whole day's
 * scans; the morning cron picks up whatever never got sent.
 */
export async function sendDailySummaryAfterScan(
  organizationId: string,
  now = new Date()
): Promise<DailySummaryOrganizationResult> {
  const window = getCurrentUtcDayWindow(now);
  if ((await countProjectsStillDueInWindow(organizationId, window)) > 0) {
    return "scans_pending";
  }
  return sendDailySummaryForOrganization({
    organizationId,
    window,
    appUrl: EMAIL_CONFIG.getAppUrl(),
    resend: requireResend(),
  });
}

function requireResend() {
  const resend = getResend();
  if (!resend) {
    throw new Error("Resend API key not configured");
  }
  return resend;
}

export async function runDailySummaryCron(
  now = new Date()
): Promise<DailySummaryCronResult> {
  const window = getPreviousUtcDayWindow(now);
  const appUrl = EMAIL_CONFIG.getAppUrl();
  const resend = requireResend();

  const result: DailySummaryCronResult = {
    windowStart: window.start.toISOString(),
    windowEnd: window.end.toISOString(),
    organizationsConsidered: 0,
    emailsSent: 0,
    skippedQuiet: 0,
    skippedUnentitled: 0,
    skippedAlreadySent: 0,
    failed: 0,
  };

  const optedInSettings = await db
    .select({ organizationId: organizations.id })
    .from(organizations)
    .leftJoin(
      organizationNotificationSettings,
      eq(organizationNotificationSettings.organizationId, organizations.id)
    )
    .where(
      or(
        eq(organizationNotificationSettings.dailySummary, true),
        isNull(organizationNotificationSettings.id)
      )
    )
    .orderBy(asc(organizations.id));

  result.organizationsConsidered = optedInSettings.length;

  for (const setting of optedInSettings) {
    try {
      const sent = await sendDailySummaryForOrganization({
        organizationId: setting.organizationId,
        window,
        appUrl,
        resend,
      });

      if (sent === "quiet" || sent === "scans_pending") {
        result.skippedQuiet += 1;
      } else if (sent === "unentitled") {
        result.skippedUnentitled += 1;
      } else if (sent === "already_sent") {
        result.skippedAlreadySent += 1;
      } else {
        result.emailsSent += sent.emailsSent;
        result.failed += Number(sent.failed);
      }
    } catch (error) {
      result.failed += 1;
      console.error("[DailySummary] Failed to send GEO recap", {
        organizationId: setting.organizationId,
        error,
      });
    }
  }

  return result;
}

async function sendDailySummaryForOrganization({
  organizationId,
  window,
  appUrl,
  resend,
}: {
  organizationId: string;
  window: DailySummaryWindow;
  appUrl: string;
  resend: NonNullable<ReturnType<typeof getResend>>;
}): Promise<DailySummaryOrganizationResult> {
  // Recaps are only for organizations whose plan includes GEO; a scan that
  // happens to exist from a trial or sample data must not trigger one.
  if (!(await hasGeoEntitlement(organizationId))) {
    return "unentitled";
  }

  const claim = await claimDailySummaryDay(organizationId, window.start);
  if (!claim) {
    return "already_sent";
  }

  const release = () =>
    releaseDailySummaryDay(organizationId, window.start, claim.previousSentFor);
  try {
    const outcome = await buildAndSendDailySummary({
      organizationId,
      window,
      appUrl,
      resend,
    });
    if (outcome === "quiet" || (outcome.emailsSent === 0 && outcome.failed)) {
      await release();
    }
    return outcome;
  } catch (error) {
    await release();
    throw error;
  }
}

async function buildAndSendDailySummary({
  organizationId,
  window: { start, end },
  appUrl,
  resend,
}: {
  organizationId: string;
  window: DailySummaryWindow;
  appUrl: string;
  resend: NonNullable<ReturnType<typeof getResend>>;
}): Promise<"quiet" | { emailsSent: number; failed: boolean }> {
  const dateKey = utcDateKey(start);
  const previousDateKey = utcDateKey(new Date(start.getTime() - MS_PER_DAY));
  const [
    org,
    ownerMemberships,
    finishedScans,
    yesterdayOverview,
    previousOverview,
  ] = await Promise.all([
    db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
      columns: { name: true, slug: true },
    }),
    db.query.members.findMany({
      where: and(
        eq(members.organizationId, organizationId),
        eq(members.role, "owner")
      ),
      with: { users: { columns: { email: true } } },
    }),
    db.query.geoScans.findMany({
      where: and(
        eq(geoScans.organizationId, organizationId),
        eq(geoScans.status, "completed"),
        gte(geoScans.finishedAt, start),
        lt(geoScans.finishedAt, end)
      ),
      columns: { id: true, projectId: true },
      orderBy: [asc(geoScans.projectId), asc(geoScans.id)],
    }),
    queryGeoCheckOverview(
      { organizationId, projectId: null },
      toGeoCheckWindow({ from: dateKey, to: dateKey })
    ),
    queryGeoCheckOverview(
      { organizationId, projectId: null },
      toGeoCheckWindow({ from: previousDateKey, to: previousDateKey })
    ),
  ]);

  const ownerEmails: string[] = [];
  for (const membership of ownerMemberships) {
    const email = membership.users.email;
    if (email) {
      ownerEmails.push(email);
    }
  }

  if (!(org && ownerEmails.length > 0)) {
    return "quiet";
  }

  const yesterday = aggregateMentionTotals(yesterdayOverview);
  if (
    isQuietDailySummary({
      scansCompleted: finishedScans.length,
      yesterdayChecks: yesterday.checks,
    })
  ) {
    return "quiet";
  }

  const projectIds = [...new Set(finishedScans.map((scan) => scan.projectId))];
  const yesterdayScanIds = new Set(finishedScans.map((scan) => scan.id));
  const [projectRows, projectChanges] = await Promise.all([
    projectIds.length === 0
      ? Promise.resolve([])
      : db.query.projects.findMany({
          where: inArray(projects.id, projectIds),
          columns: { id: true, name: true },
        }),
    Promise.all(
      projectIds.map(async (projectId) => {
        const comparison = await queryGeoScanComparison({
          projectId,
          window: { from: start, toExclusive: end },
        });
        if (
          !comparison.currentScan ||
          !yesterdayScanIds.has(comparison.currentScan.id)
        ) {
          return null;
        }

        const events = diffScanChecks(
          comparison.previous.map(toGeoScanCheckSnapshot),
          comparison.current.map(toGeoScanCheckSnapshot)
        );

        return { projectId, events };
      })
    ),
  ]);

  const projectNames = new Map(
    projectRows.map((project) => [project.id, project.name])
  );
  const includeProjectName = projectIds.length > 1;
  const allEvents = projectChanges.flatMap((entry) => {
    if (!entry) {
      return [];
    }

    const projectName = projectNames.get(entry.projectId);
    return entry.events.map((event) =>
      toSummaryChangeItem(event, {
        projectName: includeProjectName ? projectName : undefined,
      })
    );
  });
  const summaries = projectChanges.flatMap((entry) =>
    entry ? [summarizeGeoChanges(entry.events)] : []
  );
  const visibleItems = allEvents.slice(0, DAILY_SUMMARY_MAX_ITEMS);
  const summary = buildDailySummary({
    windowStart: start,
    scansCompleted: finishedScans.length,
    yesterday,
    previousDay: aggregateMentionTotals(previousOverview),
    changes: mergeChangesSummaries(summaries),
    items: visibleItems,
    remainingCount: Math.max(allEvents.length - visibleItems.length, 0),
  });

  let sent = 0;
  let failed = false;
  // Send sequentially so recipient retries do not create concurrent Resend bursts.
  for (const recipientEmail of ownerEmails) {
    const result = await sendDailySummaryEmail(resend, {
      recipientEmail,
      organizationName: org.name,
      organizationSlug: org.slug,
      dateLabel: summary.dateLabel,
      headline: summary.headline,
      mentionRateLabel: summary.mentionRateLabel,
      mentionRateDeltaLabel: summary.mentionRateDeltaLabel,
      scansCompleted: summary.scansCompleted,
      gained: summary.gained,
      lost: summary.lost,
      netChange: summary.netChange,
      items: summary.items,
      remainingCount: summary.remainingCount,
      dashboardLink: `${appUrl}/${org.slug}/geo`,
      dateKey,
    });

    if (result.error) {
      console.warn(
        `[DailySummary] Failed to send GEO recap to ${recipientEmail}:`,
        result.error
      );
      failed = true;
      continue;
    }

    sent += 1;
  }

  return { emailsSent: sent, failed };
}

function toSummaryChangeItem(
  event: GeoChangeEvent,
  { projectName }: { projectName?: string }
) {
  const prompt = truncatePrompt(event.prompt, DAILY_SUMMARY_PROMPT_MAX_LENGTH);
  const family = engineFamilyOf(event.engine);
  const engineLabel = engineFamilyLabel(family);
  const kindLabel = GEO_CHANGE_KIND_LABELS[event.kind];

  return {
    title: projectName ? `${projectName}: ${prompt}` : prompt,
    detail: kindLabel,
    engineLabel,
    engineIconSrc: engineEmailLogoSrc(family),
    tone: changeTone(event.kind),
  };
}

function changeTone(kind: GeoChangeKind): "up" | "down" | "neutral" {
  if (
    kind === "gained_mention" ||
    kind === "position_improved" ||
    kind === "citation_added"
  ) {
    return "up";
  }

  if (
    kind === "lost_mention" ||
    kind === "competitor_displaced" ||
    kind === "position_dropped" ||
    kind === "citation_removed"
  ) {
    return "down";
  }

  return "neutral";
}
