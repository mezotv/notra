import type { GeoPlannerGapPrompt } from "@notra/ai/types/geo-writer";
import { db } from "@notra/db/drizzle";
import {
  geoCompetitors,
  geoContentBriefs,
  geoMentionChecks,
  geoPromptSuggestions,
  geoPrompts,
  geoSettings,
} from "@notra/db/schema";
import type { GeoContentBriefStatus } from "@notra/db/types/geo-writer";
import { and, asc, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { Effect } from "effect";

import {
  GEO_GAPS_MAX_CHECKS,
  GEO_GAPS_SEARCH_LIMIT,
  GEO_WRITER_GAP_LOOKBACK_DAYS,
  GEO_WRITER_PLANNER_GAP_LIMIT,
} from "@/constants/geo";
import { competitorKey } from "@/lib/geo/domain";
import { geoDb } from "@/lib/geo/effect";
import { requireWriterEnabled } from "@/lib/geo/flag";
import { requireGeoProject } from "@/lib/geo/projects";
import {
  customPromptScanId,
  findPromptMentionEntry,
  isConversationScanPromptId,
  isCustomPromptScanId,
} from "@/lib/geo/prompts";
import type {
  GeoContentGapsResponse,
  GeoGapBriefRef,
  GeoPromptGapRow,
  GeoScopeInput,
  GeoSearchGapRow,
} from "@/types/geo";
import { competitorCanonicalMap } from "@/utils/geo-competitors";
import {
  gapOpportunityScore,
  isMissingMajority,
  searchGapImpressions,
} from "@/utils/geo-gaps";

const MS_PER_DAY = 86_400_000;

interface GapBriefRow {
  id: string;
  status: GeoContentBriefStatus;
  postId: string | null;
  sourceKind: string;
  sourceId: string | null;
  workingTitle: string;
}

interface PromptGapAgg {
  promptText: string;
  total: number;
  mentioned: number;
  missing: string[];
  competitors: string[];
}

function toBriefRef(row: GapBriefRow | undefined): GeoGapBriefRef | null {
  if (!row) {
    return null;
  }
  return {
    briefId: row.id,
    status: row.status,
    postId: row.postId,
    workingTitle: row.workingTitle,
  };
}

function sourceKey(kind: string, sourceId: string): string {
  return `${kind}:${sourceId}`;
}

function lookbackSince(): Date {
  return new Date(Date.now() - GEO_WRITER_GAP_LOOKBACK_DAYS * MS_PER_DAY);
}

const loadMentionGapInputs = Effect.fn("geo.mentionGapInputs")(function* (
  projectId: string
) {
  const since = lookbackSince();
  return yield* Effect.all([
    geoDb("mention checks lookup failed", () =>
      db
        .selectDistinctOn(
          [geoMentionChecks.promptId, geoMentionChecks.engine],
          {
            promptId: geoMentionChecks.promptId,
            engine: geoMentionChecks.engine,
            prompt: geoMentionChecks.prompt,
            mentioned: geoMentionChecks.mentioned,
            competitors: geoMentionChecks.competitors,
          }
        )
        .from(geoMentionChecks)
        .where(
          and(
            eq(geoMentionChecks.projectId, projectId),
            eq(geoMentionChecks.turn, 0),
            gte(geoMentionChecks.capturedAt, since)
          )
        )
        .orderBy(
          geoMentionChecks.promptId,
          geoMentionChecks.engine,
          desc(geoMentionChecks.capturedAt)
        )
        .limit(GEO_GAPS_MAX_CHECKS)
    ),
    geoDb("prompts lookup failed", () =>
      db
        .select({
          id: geoPrompts.id,
          prompt: geoPrompts.prompt,
          title: geoPrompts.title,
        })
        .from(geoPrompts)
        .where(
          and(eq(geoPrompts.projectId, projectId), eq(geoPrompts.enabled, true))
        )
        .orderBy(asc(geoPrompts.createdAt))
    ),
  ]);
});

function aggregateMentionChecks(
  checks: Array<{
    promptId: string;
    prompt: string;
    mentioned: boolean;
    engine: string;
    competitors: string[];
  }>
): Map<string, PromptGapAgg> {
  const byPrompt = new Map<string, PromptGapAgg>();
  for (const check of checks) {
    const entry = byPrompt.get(check.promptId) ?? {
      promptText: check.prompt,
      total: 0,
      mentioned: 0,
      missing: [] as string[],
      competitors: [] as string[],
    };
    entry.total += 1;
    if (check.mentioned) {
      entry.mentioned += 1;
    } else {
      entry.missing.push(check.engine);
      entry.competitors.push(...check.competitors);
    }
    byPrompt.set(check.promptId, entry);
  }
  return byPrompt;
}

function forEachMissingMajorityGap(
  prompts: Array<{ id: string; prompt: string; title: string | null }>,
  byPrompt: Map<string, PromptGapAgg>,
  onGap: (
    id: string,
    prompt: string,
    title: string | null,
    entry: PromptGapAgg
  ) => void
) {
  const matchedScanIds = new Set<string>();
  for (const prompt of prompts) {
    const entry = findPromptMentionEntry(byPrompt, prompt.id);
    if (!entry) {
      continue;
    }
    matchedScanIds.add(prompt.id);
    matchedScanIds.add(customPromptScanId(prompt.id));
    if (isMissingMajority(entry.missing.length, entry.total)) {
      onGap(prompt.id, prompt.prompt, prompt.title, entry);
    }
  }
  for (const [scanId, entry] of byPrompt) {
    if (
      matchedScanIds.has(scanId) ||
      isConversationScanPromptId(scanId) ||
      isCustomPromptScanId(scanId)
    ) {
      continue;
    }
    if (isMissingMajority(entry.missing.length, entry.total)) {
      onGap(scanId, entry.promptText, null, entry);
    }
  }
}

export const loadPlannerGapPrompts = Effect.fn("geo.plannerGaps")(function* (
  projectId: string
) {
  const [checks, prompts] = yield* loadMentionGapInputs(projectId);
  const byPrompt = aggregateMentionChecks(checks);
  const gaps: GeoPlannerGapPrompt[] = [];
  forEachMissingMajorityGap(prompts, byPrompt, (_id, prompt, _title, entry) => {
    if (gaps.length >= GEO_WRITER_PLANNER_GAP_LIMIT) {
      return;
    }
    gaps.push({ prompt, engines: entry.missing });
  });
  return { gaps };
});

export const loadGeoContentGaps = Effect.fn("geo.gaps")(function* (
  input: GeoScopeInput
) {
  yield* requireWriterEnabled(input.organizationId);
  const scope = yield* requireGeoProject(input);
  const projectId = scope.projectId;

  const [mentionInputs, pending, briefs, competitorRows, settingsRow] =
    yield* Effect.all([
      loadMentionGapInputs(projectId),
      geoDb("prompt suggestions lookup failed", () =>
        db
          .select({
            id: geoPromptSuggestions.id,
            prompt: geoPromptSuggestions.prompt,
            title: geoPromptSuggestions.title,
            sourceKeywords: geoPromptSuggestions.sourceKeywords,
          })
          .from(geoPromptSuggestions)
          .where(
            and(
              eq(geoPromptSuggestions.organizationId, scope.organizationId),
              eq(geoPromptSuggestions.status, "pending")
            )
          )
          .orderBy(desc(geoPromptSuggestions.createdAt))
          .limit(GEO_GAPS_SEARCH_LIMIT)
      ),
      geoDb("briefs lookup failed", () =>
        db
          .selectDistinctOn(
            [geoContentBriefs.sourceKind, geoContentBriefs.sourceId],
            {
              id: geoContentBriefs.id,
              status: geoContentBriefs.status,
              postId: geoContentBriefs.postId,
              sourceKind: geoContentBriefs.sourceKind,
              sourceId: geoContentBriefs.sourceId,
              workingTitle: sql<string>`${geoContentBriefs.brief}->>'workingTitle'`,
            }
          )
          .from(geoContentBriefs)
          .where(
            and(
              eq(geoContentBriefs.projectId, projectId),
              inArray(geoContentBriefs.sourceKind, ["gap", "search_console"]),
              isNotNull(geoContentBriefs.sourceId)
            )
          )
          .orderBy(
            geoContentBriefs.sourceKind,
            geoContentBriefs.sourceId,
            desc(geoContentBriefs.updatedAt)
          )
      ),
      geoDb("competitors lookup failed", () =>
        db
          .select({
            name: geoCompetitors.name,
            synonyms: geoCompetitors.synonyms,
          })
          .from(geoCompetitors)
          .where(eq(geoCompetitors.projectId, projectId))
      ),
      geoDb("settings competitors lookup failed", () =>
        db.query.geoSettings.findFirst({
          columns: { competitors: true },
          where: eq(geoSettings.projectId, projectId),
        })
      ),
    ]);
  const [checks, prompts] = mentionInputs;

  const trackedAliases = competitorCanonicalMap([
    ...competitorRows,
    ...(settingsRow?.competitors ?? []).map((name) => ({
      name,
      synonyms: [] as string[],
    })),
  ]);

  const briefBySource = new Map<string, GapBriefRow>();
  for (const brief of briefs) {
    if (!brief.sourceId) {
      continue;
    }
    briefBySource.set(sourceKey(brief.sourceKind, brief.sourceId), brief);
  }

  const byPrompt = aggregateMentionChecks(checks);
  const promptGaps: GeoPromptGapRow[] = [];

  forEachMissingMajorityGap(prompts, byPrompt, (id, prompt, title, entry) => {
    const competitorNames = [
      ...new Set(
        entry.competitors.flatMap((name) => {
          const canonical = trackedAliases.get(competitorKey(name));
          return canonical ? [canonical] : [];
        })
      ),
    ];
    const ownMentionRate = entry.mentioned / entry.total;
    promptGaps.push({
      id,
      prompt,
      title,
      engines: entry.missing,
      competitors: competitorNames,
      ownMentionRate,
      engineCoverage: entry.total,
      opportunity: gapOpportunityScore(
        ownMentionRate,
        competitorNames.length,
        entry.total
      ),
      brief: toBriefRef(briefBySource.get(sourceKey("gap", id))),
    });
  });
  promptGaps.sort((a, b) => b.opportunity - a.opportunity);

  const searchGaps: GeoSearchGapRow[] = pending.map((suggestion) => ({
    id: suggestion.id,
    prompt: suggestion.prompt,
    title: suggestion.title,
    impressions: searchGapImpressions(suggestion.sourceKeywords),
    brief: toBriefRef(
      briefBySource.get(sourceKey("search_console", suggestion.id))
    ),
  }));

  const response: GeoContentGapsResponse = {
    promptGaps,
    searchGaps,
    hasScanData: checks.length > 0,
  };
  return response;
});
