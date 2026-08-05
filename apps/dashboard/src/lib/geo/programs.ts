import {
  isTinybirdConfigured,
  queryGeoCompetitorPrompts,
  queryGeoCompetitorShare,
  queryGeoCompetitorTimeseries,
  queryGeoJourneyDetail,
  queryGeoLanguageShare,
  queryGeoOverview,
  queryGeoPromptResults,
  queryGeoTimeseries,
  queryGeoTrafficJourneys,
  queryGeoTrafficLog,
  queryGeoTrafficOverview,
  queryGeoTrafficPages,
  queryGeoTrafficTimeseries,
  queryModelUsageLatest,
} from "@notra/analytics/tinybird/client";
import { db } from "@notra/db/drizzle";
import {
  brandSettings,
  geoCompetitors,
  geoPrompts,
  geoSettings,
} from "@notra/db/schema";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { Effect } from "effect";
import {
  AI_TRAFFIC_DEFAULT_DAYS,
  AI_TRAFFIC_DEFAULT_JOURNEYS_LIMIT,
  AI_TRAFFIC_DEFAULT_LOG_LIMIT,
  AI_TRAFFIC_DEFAULT_PAGES_LIMIT,
  GEO_COMPETITOR_DETAIL_DAYS,
  GEO_JOURNEY_DETAIL_LIMIT,
  GEO_MODEL_USAGE_ATTRIBUTION,
  GEO_MODEL_USAGE_DEFAULT_LIMIT,
  GEO_MODEL_USAGE_SOURCE,
} from "@/constants/geo";
import { competitorKey } from "@/lib/geo/domain";
import { geoDb, geoQuery } from "@/lib/geo/effect";
import {
  GeoPromptCreateFailedError,
  GeoPromptNotFoundError,
  GeoScanStartError,
  GeoSettingsMissingError,
} from "@/lib/geo/errors";
import {
  buildCoverageByModel,
  toGeoCompetitor,
  toGeoSettings,
  toGeoTrafficLogEntry,
  toModelUsageRow,
  toNullableNumber,
  toTrackedPrompt,
} from "@/lib/geo/mappers";
import { buildGeoPrompts } from "@/lib/geo/prompts";
import { startGeoScanRun } from "@/lib/workflows/start";
import type {
  AiTrafficResponse,
  GeoCompetitor,
  GeoCompetitorDetailResponse,
  GeoCompetitorSeed,
  GeoCompetitorShareResponse,
  GeoCompetitorsResponse,
  GeoCompetitorUpsertInput,
  GeoJourneyDetailResponse,
  GeoLanguageShareResponse,
  GeoModelUsageResponse,
  GeoOverviewResponse,
  GeoPromptResultsResponse,
  GeoSettingsResponse,
  GeoSettingsUpsertInput,
  GeoTimeseriesResponse,
  GeoTrackedPrompt,
  GeoTrackedPromptsResponse,
  GeoTrafficJourneysResponse,
  GeoTrafficLogResponse,
  GeoTrafficPagesResponse,
  GeoTrafficSource,
} from "@/types/geo";
import { toGeoTrafficTotals, toGeoVisitorType } from "@/utils/ai-traffic";

function mergeLegacyCompetitors(
  competitors: GeoCompetitor[],
  legacyNames: readonly string[]
): GeoCompetitor[] {
  const seen = new Set(
    competitors.map((competitor) => competitorKey(competitor.name))
  );
  const merged = [...competitors];
  for (const name of legacyNames) {
    const key = competitorKey(name);
    if (key.length === 0 || seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push({
      id: `legacy:${key}`,
      name,
      domain: null,
      synonyms: [],
      kind: "direct",
      color: null,
    });
  }
  return merged;
}

export const loadGeoSettings = Effect.fn("geo.settings")(function* (
  organizationId: string
) {
  const row = yield* geoDb("settings lookup failed", () =>
    db.query.geoSettings.findFirst({
      where: eq(geoSettings.organizationId, organizationId),
    })
  );

  const response: GeoSettingsResponse = {
    configured: isTinybirdConfigured(),
    settings: row ? toGeoSettings(row) : null,
  };
  return response;
});

export const syncGeoCompetitors = Effect.fn("geo.competitorsSync")(function* (
  organizationId: string,
  entries: readonly GeoCompetitorSeed[]
) {
  const rows = yield* geoDb("competitors sync failed", () =>
    db.transaction(async (tx) => {
      const existing = await tx.query.geoCompetitors.findMany({
        where: eq(geoCompetitors.organizationId, organizationId),
      });
      const existingByName = new Map(
        existing.map((row) => [competitorKey(row.name), row])
      );

      const resolved: Required<GeoCompetitorSeed>[] = [];
      const seen = new Set<string>();
      for (const entry of entries) {
        const name = entry.name.trim();
        const key = competitorKey(name);
        if (name.length === 0 || seen.has(key)) {
          continue;
        }
        seen.add(key);
        const previous = existingByName.get(key);
        resolved.push({
          name,
          domain: entry.domain ?? previous?.domain ?? null,
          synonyms: entry.synonyms ?? previous?.synonyms ?? [],
          kind: entry.kind ?? previous?.kind ?? "direct",
          color: entry.color ?? previous?.color ?? null,
        });
      }

      const staleIds = existing
        .filter((row) => !seen.has(competitorKey(row.name)))
        .map((row) => row.id);
      if (staleIds.length > 0) {
        await tx
          .delete(geoCompetitors)
          .where(inArray(geoCompetitors.id, staleIds));
      }

      if (resolved.length > 0) {
        await tx
          .insert(geoCompetitors)
          .values(
            resolved.map((entry) => ({
              id: crypto.randomUUID(),
              organizationId,
              name: entry.name,
              domain: entry.domain,
              synonyms: entry.synonyms,
              kind: entry.kind,
              color: entry.color,
            }))
          )
          .onConflictDoUpdate({
            target: [geoCompetitors.organizationId, geoCompetitors.name],
            set: {
              domain: sql`excluded.domain`,
              synonyms: sql`excluded.synonyms`,
              kind: sql`excluded.kind`,
              color: sql`excluded.color`,
            },
          });
      }

      await tx
        .update(geoSettings)
        .set({ competitors: resolved.map((entry) => entry.name) })
        .where(eq(geoSettings.organizationId, organizationId));

      return await tx.query.geoCompetitors.findMany({
        where: eq(geoCompetitors.organizationId, organizationId),
        orderBy: [asc(geoCompetitors.createdAt)],
      });
    })
  );

  return rows.map(toGeoCompetitor);
});

export const loadGeoCompetitors = Effect.fn("geo.competitors")(function* (
  organizationId: string
) {
  const [rows, settingsRow] = yield* Effect.all(
    [
      geoDb("competitors lookup failed", () =>
        db.query.geoCompetitors.findMany({
          where: eq(geoCompetitors.organizationId, organizationId),
          orderBy: [asc(geoCompetitors.createdAt)],
        })
      ),
      geoDb("settings lookup failed", () =>
        db.query.geoSettings.findFirst({
          columns: { competitors: true },
          where: eq(geoSettings.organizationId, organizationId),
        })
      ),
    ],
    { concurrency: "unbounded" }
  );

  const response: GeoCompetitorsResponse = {
    competitors: mergeLegacyCompetitors(
      rows.map(toGeoCompetitor),
      settingsRow?.competitors ?? []
    ),
  };
  return response;
});

export const upsertGeoCompetitor = Effect.fn("geo.competitorUpsert")(function* (
  organizationId: string,
  input: GeoCompetitorUpsertInput
) {
  const current = yield* loadGeoCompetitors(organizationId);
  const key = competitorKey(input.name);
  const entries: GeoCompetitorSeed[] = current.competitors.map((competitor) =>
    competitorKey(competitor.name) === key
      ? {
          name: competitor.name,
          domain: input.domain,
          synonyms: input.synonyms ?? competitor.synonyms,
          kind: input.kind ?? competitor.kind,
          color: input.color ?? competitor.color,
        }
      : {
          name: competitor.name,
          domain: competitor.domain,
          synonyms: competitor.synonyms,
          kind: competitor.kind,
          color: competitor.color,
        }
  );

  if (!entries.some((entry) => competitorKey(entry.name) === key)) {
    entries.push({
      name: input.name.trim(),
      domain: input.domain,
      synonyms: input.synonyms ?? [],
      kind: input.kind ?? "direct",
      color: input.color ?? null,
    });
  }

  const competitors = yield* syncGeoCompetitors(organizationId, entries);
  const response: GeoCompetitorsResponse = { competitors };
  return response;
});

export const deleteGeoCompetitor = Effect.fn("geo.competitorDelete")(function* (
  organizationId: string,
  name: string
) {
  const current = yield* loadGeoCompetitors(organizationId);
  const key = competitorKey(name);
  const entries: GeoCompetitorSeed[] = current.competitors
    .filter((competitor) => competitorKey(competitor.name) !== key)
    .map((competitor) => ({
      name: competitor.name,
      domain: competitor.domain,
      synonyms: competitor.synonyms,
      kind: competitor.kind,
      color: competitor.color,
    }));

  const competitors = yield* syncGeoCompetitors(organizationId, entries);
  const response: GeoCompetitorsResponse = { competitors };
  return response;
});

export const upsertGeoSettings = Effect.fn("geo.settingsUpsert")(function* (
  input: GeoSettingsUpsertInput
) {
  yield* geoDb("settings upsert failed", () =>
    db
      .insert(geoSettings)
      .values({
        id: crypto.randomUUID(),
        organizationId: input.organizationId,
        companyName: input.companyName,
        aliases: input.aliases,
        competitors: input.competitors,
        languages: input.languages,
        enabled: input.enabled,
      })
      .onConflictDoUpdate({
        target: geoSettings.organizationId,
        set: {
          companyName: input.companyName,
          aliases: input.aliases,
          competitors: input.competitors,
          languages: input.languages,
          enabled: input.enabled,
        },
      })
  );

  yield* syncGeoCompetitors(
    input.organizationId,
    input.competitors.map((name) => ({ name, domain: null }))
  );

  const rows = yield* geoDb("settings lookup failed", () =>
    db
      .select()
      .from(geoSettings)
      .where(eq(geoSettings.organizationId, input.organizationId))
  );

  const row = rows.at(0);
  const response: GeoSettingsResponse = {
    configured: isTinybirdConfigured(),
    settings: row ? toGeoSettings(row) : null,
  };
  return response;
});

export const loadGeoLanguageShare = Effect.fn("geo.languageShare")(function* (
  organizationId: string,
  days: number | undefined
) {
  const result = yield* geoQuery("language share query failed", () =>
    queryGeoLanguageShare({ organization_id: organizationId, days })
  );

  const response: GeoLanguageShareResponse = {
    configured: isTinybirdConfigured(),
    points: (result?.data ?? []).map((row) => ({
      language: row.language_name,
      checks: Number(row.checks),
      mentions: Number(row.mentions),
      mentionRate: Number(row.mention_rate),
      avgPosition: toNullableNumber(row.avg_position),
    })),
  };
  return response;
});

export const loadGeoOverview = Effect.fn("geo.overview")(function* (
  organizationId: string,
  days: number | undefined
) {
  const result = yield* geoQuery("overview query failed", () =>
    queryGeoOverview({ organization_id: organizationId, days })
  );

  const response: GeoOverviewResponse = {
    configured: isTinybirdConfigured(),
    engines: (result?.data ?? []).map((row) => ({
      engine: row.engine,
      checks: Number(row.checks),
      mentions: Number(row.mentions),
      mentionRate: Number(row.mention_rate),
      avgPosition: toNullableNumber(row.avg_position),
      lastCheckedAt: row.last_checked_at,
    })),
  };
  return response;
});

export const loadGeoTimeseries = Effect.fn("geo.timeseries")(function* (
  organizationId: string,
  days: number | undefined
) {
  const result = yield* geoQuery("timeseries query failed", () =>
    queryGeoTimeseries({ organization_id: organizationId, days })
  );

  const response: GeoTimeseriesResponse = {
    configured: isTinybirdConfigured(),
    points: (result?.data ?? []).map((row) => ({
      day: row.day,
      engine: row.engine,
      checks: Number(row.checks),
      mentions: Number(row.mentions),
    })),
  };
  return response;
});

export const loadGeoPromptResults = Effect.fn("geo.promptResults")(function* (
  organizationId: string
) {
  const result = yield* geoQuery("prompt results query failed", () =>
    queryGeoPromptResults({ organization_id: organizationId })
  );

  const response: GeoPromptResultsResponse = {
    configured: isTinybirdConfigured(),
    results: (result?.data ?? []).map((row) => ({
      promptId: row.prompt_id,
      engine: row.engine,
      prompt: row.prompt,
      mentioned: row.mentioned,
      position: toNullableNumber(row.position),
      sentiment: row.sentiment,
      excerpt: row.excerpt,
      lastCheckedAt: row.last_checked_at,
    })),
  };
  return response;
});

export const loadGeoCompetitorShare = Effect.fn("geo.competitorShare")(
  function* (organizationId: string, days: number | undefined) {
    const result = yield* geoQuery("competitor share query failed", () =>
      queryGeoCompetitorShare({ organization_id: organizationId, days })
    );

    const response: GeoCompetitorShareResponse = {
      configured: isTinybirdConfigured(),
      points: (result?.data ?? []).map((row) => ({
        brand: row.brand,
        mentions: Number(row.mentions),
      })),
    };
    return response;
  }
);

export const loadGeoCompetitorDetail = Effect.fn("geo.competitorDetail")(
  function* (organizationId: string, brand: string, days: number | undefined) {
    const resolvedDays = days ?? GEO_COMPETITOR_DETAIL_DAYS;

    const [timeseries, prompts] = yield* Effect.all(
      [
        geoQuery("competitor timeseries query failed", () =>
          queryGeoCompetitorTimeseries({
            organization_id: organizationId,
            brand,
            days: resolvedDays,
          })
        ),
        geoQuery("competitor prompts query failed", () =>
          queryGeoCompetitorPrompts({
            organization_id: organizationId,
            brand,
            days: resolvedDays,
          })
        ),
      ],
      { concurrency: "unbounded" }
    );

    const response: GeoCompetitorDetailResponse = {
      configured: isTinybirdConfigured(),
      points: (timeseries?.data ?? []).map((row) => ({
        day: row.day,
        mentions: Number(row.mentions),
        checks: Number(row.checks),
      })),
      prompts: (prompts?.data ?? []).map((row) => ({
        promptId: row.prompt_id,
        prompt: row.prompt,
        engine: row.engine,
        capturedAt: row.captured_at,
        mentioned: row.mentioned,
        position: toNullableNumber(row.position),
      })),
    };
    return response;
  }
);

export const loadGeoModelUsage = Effect.fn("geo.modelUsage")(function* (
  organizationId: string,
  days: number | undefined,
  limit: number | undefined
) {
  const [usage, overview] = yield* Effect.all(
    [
      geoQuery("model usage query failed", () =>
        queryModelUsageLatest({
          source: GEO_MODEL_USAGE_SOURCE,
          limit: limit ?? GEO_MODEL_USAGE_DEFAULT_LIMIT,
        })
      ),
      geoQuery("overview query failed", () =>
        queryGeoOverview({ organization_id: organizationId, days })
      ),
    ],
    { concurrency: "unbounded" }
  );

  const coverage = buildCoverageByModel(overview?.data ?? []);
  const rows = usage?.data ?? [];

  const response: GeoModelUsageResponse = {
    configured: isTinybirdConfigured(),
    source: GEO_MODEL_USAGE_SOURCE,
    attribution: GEO_MODEL_USAGE_ATTRIBUTION,
    capturedAt: rows[0]?.captured_at ?? null,
    models: rows.map((row) =>
      toModelUsageRow(
        row.model,
        row.rank,
        Number(row.share),
        row.raw_tokens,
        coverage.get(row.model)
      )
    ),
  };
  return response;
});

export const loadAiTraffic = Effect.fn("geo.aiTraffic")(function* (
  organizationId: string,
  days: number | undefined
) {
  const resolvedDays = days ?? AI_TRAFFIC_DEFAULT_DAYS;

  const [overview, timeseries] = yield* Effect.all(
    [
      geoQuery("traffic overview query failed", () =>
        queryGeoTrafficOverview({
          organization_id: organizationId,
          days: resolvedDays,
        })
      ),
      geoQuery("traffic timeseries query failed", () =>
        queryGeoTrafficTimeseries({
          organization_id: organizationId,
          days: resolvedDays,
        })
      ),
    ],
    { concurrency: "unbounded" }
  );

  const sources: GeoTrafficSource[] = (overview?.data ?? []).map((row) => ({
    source: row.source,
    visitorType: toGeoVisitorType(row.visitor_type),
    agent: row.agent,
    category: row.category,
    confidence: row.confidence,
    visits: Number(row.visits),
    markdownVisits: Number(row.markdown_visits),
    paths: Number(row.paths),
    lastSeenAt: row.last_seen_at,
  }));

  const response: AiTrafficResponse = {
    configured: isTinybirdConfigured(),
    totals: toGeoTrafficTotals(sources),
    sources: sources.filter(
      (row) =>
        row.visitorType === "crawler" || row.visitorType === "ai_referral"
    ),
    points: (timeseries?.data ?? []).map((row) => ({
      day: row.day,
      visitorType: toGeoVisitorType(row.visitor_type),
      visits: Number(row.visits),
    })),
  };
  return response;
});

export const loadGeoTrafficLog = Effect.fn("geo.trafficLog")(function* (
  organizationId: string,
  limit: number | undefined,
  visitorType: string | undefined,
  category: string | undefined
) {
  const log = yield* geoQuery("traffic log query failed", () =>
    queryGeoTrafficLog({
      organization_id: organizationId,
      limit: limit ?? AI_TRAFFIC_DEFAULT_LOG_LIMIT,
      visitor_type: visitorType ?? "",
      category: category ?? "",
    })
  );

  const response: GeoTrafficLogResponse = {
    configured: isTinybirdConfigured(),
    log: (log?.data ?? []).map(toGeoTrafficLogEntry),
  };
  return response;
});

export const loadGeoTrafficJourneys = Effect.fn("geo.trafficJourneys")(
  function* (
    organizationId: string,
    days: number | undefined,
    limit: number | undefined
  ) {
    const journeys = yield* geoQuery("traffic journeys query failed", () =>
      queryGeoTrafficJourneys({
        organization_id: organizationId,
        days: days ?? AI_TRAFFIC_DEFAULT_DAYS,
        limit: limit ?? AI_TRAFFIC_DEFAULT_JOURNEYS_LIMIT,
      })
    );

    const response: GeoTrafficJourneysResponse = {
      configured: isTinybirdConfigured(),
      journeys: (journeys?.data ?? []).map((row) => ({
        journeyId: row.journey_id,
        source: row.source,
        visitorType: toGeoVisitorType(row.visitor_type),
        pages: Number(row.pages),
        distinctPaths: Number(row.distinct_paths),
        firstSeenAt: row.first_seen_at,
        lastSeenAt: row.last_seen_at,
        samplePaths: row.sample_paths,
      })),
    };
    return response;
  }
);

export const loadGeoJourneyDetail = Effect.fn("geo.journeyDetail")(function* (
  organizationId: string,
  journeyId: string,
  days: number | undefined
) {
  const detail = yield* geoQuery("journey detail query failed", () =>
    queryGeoJourneyDetail({
      organization_id: organizationId,
      journey_id: journeyId,
      days: days ?? AI_TRAFFIC_DEFAULT_DAYS,
      limit: GEO_JOURNEY_DETAIL_LIMIT,
    })
  );

  const response: GeoJourneyDetailResponse = {
    configured: isTinybirdConfigured(),
    events: (detail?.data ?? []).map((row) => ({
      capturedAt: row.captured_at,
      path: row.path,
      host: row.host,
      method: row.method,
      referer: row.referer,
      country: row.country,
      agent: row.agent,
      category: row.category,
    })),
  };
  return response;
});

export const loadGeoTrafficPages = Effect.fn("geo.trafficPages")(function* (
  organizationId: string,
  days: number | undefined,
  limit: number | undefined,
  visitorType: string | undefined
) {
  const pages = yield* geoQuery("traffic pages query failed", () =>
    queryGeoTrafficPages({
      organization_id: organizationId,
      days: days ?? AI_TRAFFIC_DEFAULT_DAYS,
      limit: limit ?? AI_TRAFFIC_DEFAULT_PAGES_LIMIT,
      visitor: visitorType ?? "",
    })
  );

  const response: GeoTrafficPagesResponse = {
    configured: isTinybirdConfigured(),
    pages: (pages?.data ?? []).map((row) => ({
      path: row.path,
      source: row.source,
      visitorType: toGeoVisitorType(row.visitor_type),
      visits: Number(row.visits),
      lastSeenAt: row.last_seen_at,
    })),
  };
  return response;
});

export const listGeoPrompts = Effect.fn("geo.promptsList")(function* (
  organizationId: string
) {
  const [customRows, settingsRow] = yield* Effect.all(
    [
      geoDb("prompts lookup failed", () =>
        db.query.geoPrompts.findMany({
          where: eq(geoPrompts.organizationId, organizationId),
          orderBy: [asc(geoPrompts.createdAt)],
        })
      ),
      geoDb("settings lookup failed", () =>
        db.query.geoSettings.findFirst({
          where: eq(geoSettings.organizationId, organizationId),
        })
      ),
    ],
    { concurrency: "unbounded" }
  );

  const prompts: GeoTrackedPrompt[] = customRows.map(toTrackedPrompt);

  if (!settingsRow) {
    const emptyResponse: GeoTrackedPromptsResponse = {
      configured: isTinybirdConfigured(),
      prompts,
    };
    return emptyResponse;
  }

  const brand = yield* geoDb("brand lookup failed", () =>
    db.query.brandSettings.findFirst({
      columns: { companyDescription: true, audience: true },
      where: and(
        eq(brandSettings.organizationId, organizationId),
        eq(brandSettings.isDefault, true)
      ),
    })
  );

  const autoPrompts = buildGeoPrompts(
    toGeoSettings(settingsRow),
    brand
      ? {
          companyDescription: brand.companyDescription,
          audience: brand.audience,
        }
      : null
  );

  for (const autoPrompt of autoPrompts) {
    prompts.push({
      id: autoPrompt.id,
      prompt: autoPrompt.text,
      enabled: true,
      source: "auto",
      createdAt: null,
    });
  }

  const response: GeoTrackedPromptsResponse = {
    configured: isTinybirdConfigured(),
    prompts,
  };
  return response;
});

export const createGeoPrompt = Effect.fn("geo.promptsCreate")(function* (
  organizationId: string,
  prompt: string
) {
  const rows = yield* geoDb("prompt create failed", () =>
    db
      .insert(geoPrompts)
      .values({
        id: crypto.randomUUID(),
        organizationId,
        prompt,
      })
      .returning()
  );

  const row = rows.at(0);
  if (!row) {
    return yield* Effect.fail(new GeoPromptCreateFailedError({}));
  }

  return toTrackedPrompt(row);
});

export const deleteGeoPrompt = Effect.fn("geo.promptsDelete")(function* (
  organizationId: string,
  promptId: string
) {
  const rows = yield* geoDb("prompt delete failed", () =>
    db
      .delete(geoPrompts)
      .where(
        and(
          eq(geoPrompts.id, promptId),
          eq(geoPrompts.organizationId, organizationId)
        )
      )
      .returning()
  );

  if (!rows.at(0)) {
    return yield* Effect.fail(new GeoPromptNotFoundError({ promptId }));
  }

  return { success: true };
});

export const toggleGeoPrompt = Effect.fn("geo.promptsToggle")(function* (
  organizationId: string,
  promptId: string,
  enabled: boolean
) {
  const rows = yield* geoDb("prompt toggle failed", () =>
    db
      .update(geoPrompts)
      .set({ enabled })
      .where(
        and(
          eq(geoPrompts.id, promptId),
          eq(geoPrompts.organizationId, organizationId)
        )
      )
      .returning()
  );

  const row = rows.at(0);
  if (!row) {
    return yield* Effect.fail(new GeoPromptNotFoundError({ promptId }));
  }

  return toTrackedPrompt(row);
});

export const startGeoScan = Effect.fn("geo.startScan")(function* (
  organizationId: string
) {
  const row = yield* geoDb("settings lookup failed", () =>
    db.query.geoSettings.findFirst({
      columns: { id: true },
      where: eq(geoSettings.organizationId, organizationId),
    })
  );

  if (!row) {
    return yield* Effect.fail(new GeoSettingsMissingError({ organizationId }));
  }

  return yield* Effect.tryPromise({
    try: () => startGeoScanRun({ organizationId }),
    catch: (cause) => new GeoScanStartError({ cause }),
  });
});
