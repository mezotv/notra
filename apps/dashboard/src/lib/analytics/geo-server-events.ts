import { db } from "@notra/db/drizzle";
import { geoPrompts, geoSettings, projects } from "@notra/db/schema";
import { requireGeoProject } from "@notra/geo-core/geo/projects";
import type { GeoScopeInput } from "@notra/geo-core/types/geo";
import { and, count, eq } from "drizzle-orm";
import { Effect } from "effect";

import {
  AGENT_READINESS_ERROR_KINDS,
  AGENT_READINESS_REPLACED_REASON_PREFIX,
} from "@/constants/geo-analytics";
import { trackServerEvent } from "@/lib/analytics/posthog-server";
import type {
  AgentReadinessErrorKind,
  GeoRouterTrackInput,
  GeoScanStartSnapshot,
  GeoSuggestionKeywordList,
  GeoSuggestionKeywordSummary,
} from "@/types/analytics/geo-events";

export function trackGeoRouterEvent({
  context,
  input,
  event,
  projectId,
  properties,
}: GeoRouterTrackInput): void {
  trackServerEvent({
    event,
    headers: context.headers,
    userId: context.user?.id ?? null,
    organizationId: input.organizationId,
    projectId: projectId ?? input.projectId ?? null,
    properties,
  });
}

export function summarizeSuggestionKeywords(
  keywords: GeoSuggestionKeywordList
): GeoSuggestionKeywordSummary {
  let impressions = 0;
  let clicks = 0;
  let position: number | null = null;
  for (const keyword of keywords) {
    impressions += keyword.impressions;
    clicks += keyword.clicks;
    if (position === null || keyword.position < position) {
      position = keyword.position;
    }
  }
  return { impressions, clicks, position };
}

export function agentReadinessErrorKind(
  reason: string | undefined
): AgentReadinessErrorKind {
  if (reason?.startsWith(AGENT_READINESS_REPLACED_REASON_PREFIX)) {
    return AGENT_READINESS_ERROR_KINDS.REPLACED;
  }
  return AGENT_READINESS_ERROR_KINDS.SCAN_FAILED;
}

export async function countGeoProjects(
  organizationId: string
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(projects)
    .where(eq(projects.organizationId, organizationId));
  return row?.value ?? 0;
}

export async function loadGeoScanStartSnapshot(
  input: GeoScopeInput
): Promise<(GeoScanStartSnapshot & { projectId: string }) | null> {
  try {
    const scope = await Effect.runPromise(requireGeoProject(input));
    const [settings, promptRows] = await Promise.all([
      db.query.geoSettings.findFirst({
        columns: {
          engines: true,
          languages: true,
          enforceZdr: true,
          lastScanAt: true,
        },
        where: eq(geoSettings.projectId, scope.projectId),
      }),
      db
        .select({ value: count() })
        .from(geoPrompts)
        .where(
          and(
            eq(geoPrompts.projectId, scope.projectId),
            eq(geoPrompts.enabled, true)
          )
        ),
    ]);
    return {
      projectId: scope.projectId,
      prompt_count: promptRows[0]?.value ?? 0,
      engine_count: settings?.engines?.length ?? 0,
      language_count: settings?.languages?.length ?? 0,
      is_first_scan: settings?.lastScanAt === null,
      zdr_enforced: settings?.enforceZdr ?? false,
    };
  } catch {
    return null;
  }
}
