import { db } from "@notra/db/drizzle";
import { geoMentionChecks } from "@notra/db/schema";
import type { GeoContentBriefBaselineJson } from "@notra/db/types/geo-writer";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { Effect } from "effect";

import {
  GEO_WRITER_EVIDENCE_MAX_ENGINES,
  GEO_WRITER_EVIDENCE_MAX_ITEMS,
  GEO_WRITER_GAP_LOOKBACK_DAYS,
} from "../constants/geo";
import type { GeoPromptEvidence, GeoPromptEvidenceEngine } from "../types/geo";
import { geoDb } from "./effect";
import { customPromptScanId, promptIdFromScanId } from "./prompts";

const MS_PER_DAY = 86_400_000;

function sourceDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function countBy(values: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function sortedCounts(counts: Map<string, number>): Array<[string, number]> {
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, GEO_WRITER_EVIDENCE_MAX_ITEMS);
}

function topNames(
  counts: Map<string, number>
): Array<{ name: string; engines: number }> {
  return sortedCounts(counts).map(([name, engines]) => ({ name, engines }));
}

function topDomains(
  counts: Map<string, number>
): Array<{ domain: string; engines: number }> {
  return sortedCounts(counts).map(([domain, engines]) => ({ domain, engines }));
}

export function evidenceToBaseline(
  evidence: GeoPromptEvidence
): GeoContentBriefBaselineJson {
  return {
    sourcePromptId: evidence.sourcePromptId,
    mentionedEngines: evidence.mentionedEngines,
    totalEngines: evidence.totalEngines,
    engines: evidence.engines.map((engine) => ({
      engine: engine.engine,
      mentioned: engine.mentioned,
      position: engine.position,
    })),
    competitorMentions: evidence.competitorMentions,
    citedDomains: evidence.citedDomains,
    capturedAt: evidence.capturedAt,
  };
}

export const loadPromptEvidence = Effect.fn("geo.writer.evidence")(function* (
  projectId: string,
  sourcePromptId: string
) {
  const since = new Date(
    Date.now() - GEO_WRITER_GAP_LOOKBACK_DAYS * MS_PER_DAY
  );
  const rawId = promptIdFromScanId(sourcePromptId);
  const promptIds = [
    ...new Set([sourcePromptId, rawId, customPromptScanId(rawId)]),
  ];
  const rows = yield* geoDb("prompt evidence lookup failed", () =>
    db
      .selectDistinctOn([geoMentionChecks.engine], {
        engine: geoMentionChecks.engine,
        promptId: geoMentionChecks.promptId,
        prompt: geoMentionChecks.prompt,
        mentioned: geoMentionChecks.mentioned,
        position: geoMentionChecks.position,
        sentiment: geoMentionChecks.sentiment,
        competitors: geoMentionChecks.competitors,
        excerpt: geoMentionChecks.excerpt,
        grounding: geoMentionChecks.grounding,
        sources: geoMentionChecks.sources,
        capturedAt: geoMentionChecks.capturedAt,
      })
      .from(geoMentionChecks)
      .where(
        and(
          eq(geoMentionChecks.projectId, projectId),
          eq(geoMentionChecks.turn, 0),
          inArray(geoMentionChecks.promptId, promptIds),
          gte(geoMentionChecks.capturedAt, since)
        )
      )
      .orderBy(geoMentionChecks.engine, desc(geoMentionChecks.capturedAt))
      .limit(GEO_WRITER_EVIDENCE_MAX_ENGINES)
  );
  if (rows.length === 0) {
    return null;
  }

  const engines: GeoPromptEvidenceEngine[] = rows.map((row) => {
    const domains = [
      ...new Set(
        [...row.grounding.sources, ...row.sources].flatMap((source) => {
          const domain = sourceDomain(source.url);
          return domain ? [domain] : [];
        })
      ),
    ];
    return {
      engine: row.engine,
      mentioned: row.mentioned,
      position: row.position,
      sentiment: row.sentiment,
      competitors: row.competitors,
      excerpt: row.excerpt,
      queries: row.grounding.queries,
      sourceDomains: domains,
      capturedAt: row.capturedAt.toISOString(),
    };
  });
  const competitorCounts = countBy(
    engines.flatMap((engine) => [...new Set(engine.competitors)])
  );
  const domainCounts = countBy(
    engines.flatMap((engine) => engine.sourceDomains)
  );
  const latest = engines.reduce<string | null>(
    (max, engine) => (max && max > engine.capturedAt ? max : engine.capturedAt),
    null
  );
  const evidence: GeoPromptEvidence = {
    sourcePromptId,
    prompt: rows[0]?.prompt ?? "",
    mentionedEngines: engines.filter((engine) => engine.mentioned).length,
    totalEngines: engines.length,
    engines,
    competitorMentions: topNames(competitorCounts),
    citedDomains: topDomains(domainCounts),
    capturedAt: latest,
  };
  return evidence;
});
