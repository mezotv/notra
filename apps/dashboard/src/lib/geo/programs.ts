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
  GEO_COMPETITOR_SHARE_LIMIT,
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
  GeoSettingsDisabledError,
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
import {
  ensureGeoProject,
  geoScopeParams,
  requireGeoProject,
  resolveGeoScope,
} from "@/lib/geo/projects";
import { buildGeoPrompts } from "@/lib/geo/prompts";
import { withGeoScanStatus } from "@/lib/geo/scan-status";
import { buildTrackedEngines } from "@/lib/geo/tracked-engines";
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
  GeoScopeInput,
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
  input: GeoScopeInput
) {
  const scope = yield* resolveGeoScope(input);
  const row = scope.projectId
    ? yield* geoDb("settings lookup failed", () =>
        db.query.geoSettings.findFirst({
          where: eq(geoSettings.projectId, scope.projectId ?? ""),
        })
      )
    : null;

  const response: GeoSettingsResponse = {
    configured: isTinybirdConfigured(),
    settings: row ? toGeoSettings(row) : null,
  };
  return response;
});

export const syncGeoCompetitors = Effect.fn("geo.competitorsSync")(function* (
  organizationId: string,
  projectId: string,
  entries: readonly GeoCompetitorSeed[]
) {
  const rows = yield* geoDb("competitors sync failed", () =>
    db.transaction(async (tx) => {
      const existing = await tx.query.geoCompetitors.findMany({
        where: eq(geoCompetitors.projectId, projectId),
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
              projectId,
              name: entry.name,
              domain: entry.domain,
              synonyms: entry.synonyms,
              kind: entry.kind,
              color: entry.color,
            }))
          )
          .onConflictDoUpdate({
            target: [geoCompetitors.projectId, geoCompetitors.name],
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
        .where(eq(geoSettings.projectId, projectId));

      return await tx.query.geoCompetitors.findMany({
        where: eq(geoCompetitors.projectId, projectId),
        orderBy: [asc(geoCompetitors.createdAt)],
      });
    })
  );

  return rows.map(toGeoCompetitor);
});

const loadCompetitorsByProject = Effect.fn("geo.competitorsByProject")(
  function* (projectId: string) {
    const [rows, settingsRow] = yield* Effect.all(
      [
        geoDb("competitors lookup failed", () =>
          db.query.geoCompetitors.findMany({
            where: eq(geoCompetitors.projectId, projectId),
            orderBy: [asc(geoCompetitors.createdAt)],
          })
        ),
        geoDb("settings lookup failed", () =>
          db.query.geoSettings.findFirst({
            columns: { competitors: true },
            where: eq(geoSettings.projectId, projectId),
          })
        ),
      ],
      { concurrency: "unbounded" }
    );

    return mergeLegacyCompetitors(
      rows.map(toGeoCompetitor),
      settingsRow?.competitors ?? []
    );
  }
);

export const loadGeoCompetitors = Effect.fn("geo.competitors")(function* (
  input: GeoScopeInput
) {
  const scope = yield* resolveGeoScope(input);
  if (!scope.projectId) {
    const emptyResponse: GeoCompetitorsResponse = { competitors: [] };
    return emptyResponse;
  }

  const response: GeoCompetitorsResponse = {
    competitors: yield* loadCompetitorsByProject(scope.projectId),
  };
  return response;
});

export const upsertGeoCompetitor = Effect.fn("geo.competitorUpsert")(function* (
  scopeInput: GeoScopeInput,
  input: GeoCompetitorUpsertInput
) {
  const scope = yield* requireGeoProject(scopeInput);
  const current = yield* loadCompetitorsByProject(scope.projectId);
  const key = competitorKey(input.name);
  const entries: GeoCompetitorSeed[] = current.map((competitor) =>
    competitorKey(competitor.name) === key
      ? {
          name: competitor.name,
          domain: input.domain,
          synonyms: input.synonyms ?? competitor.synonyms,
          kind: input.kind ?? competitor.kind,
          color: input.color ?? competitor.color,
        }
      : competitor
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

  const competitors = yield* syncGeoCompetitors(
    scope.organizationId,
    scope.projectId,
    entries
  );
  const response: GeoCompetitorsResponse = { competitors };
  return response;
});

export const deleteGeoCompetitor = Effect.fn("geo.competitorDelete")(function* (
  scopeInput: GeoScopeInput,
  name: string
) {
  const scope = yield* requireGeoProject(scopeInput);
  const current = yield* loadCompetitorsByProject(scope.projectId);
  const key = competitorKey(name);
  const entries: GeoCompetitorSeed[] = current.filter(
    (competitor) => competitorKey(competitor.name) !== key
  );

  const competitors = yield* syncGeoCompetitors(
    scope.organizationId,
    scope.projectId,
    entries
  );
  const response: GeoCompetitorsResponse = { competitors };
  return response;
});

export const upsertGeoSettings = Effect.fn("geo.settingsUpsert")(function* (
  input: GeoSettingsUpsertInput
) {
  const projectId = yield* ensureGeoProject(
    { organizationId: input.organizationId, projectId: input.projectId },
    input.companyName
  );

  yield* geoDb("settings upsert failed", () =>
    db
      .insert(geoSettings)
      .values({
        id: crypto.randomUUID(),
        organizationId: input.organizationId,
        projectId,
        companyName: input.companyName,
        aliases: input.aliases,
        competitors: input.competitors,
        languages: input.languages,
        enabled: input.enabled,
      })
      .onConflictDoUpdate({
        target: geoSettings.projectId,
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
    projectId,
    input.competitors.map((name) => ({ name, domain: null }))
  );

  const rows = yield* geoDb("settings lookup failed", () =>
    db.select().from(geoSettings).where(eq(geoSettings.projectId, projectId))
  );

  const row = rows.at(0);
  const response: GeoSettingsResponse = {
    configured: isTinybirdConfigured(),
    settings: row ? toGeoSettings(row) : null,
  };
  return response;
});

export const loadGeoLanguageShare = Effect.fn("geo.languageShare")(function* (
  input: GeoScopeInput,
  days: number | undefined
) {
  const scope = yield* resolveGeoScope(input);
  const result = yield* geoQuery("language share query failed", () =>
    queryGeoLanguageShare({
      ...geoScopeParams(scope),
      days,
    })
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
  input: GeoScopeInput,
  days: number | undefined
) {
  const scope = yield* resolveGeoScope(input);
  const result = yield* geoQuery("overview query failed", () =>
    queryGeoOverview({
      ...geoScopeParams(scope),
      days,
    })
  );

  const engines: GeoOverviewResponse["engines"] = (result?.data ?? []).map(
    (row) => ({
      engine: row.engine,
      checks: Number(row.checks),
      mentions: Number(row.mentions),
      mentionRate: Number(row.mention_rate),
      avgPosition: toNullableNumber(row.avg_position),
      lastCheckedAt: row.last_checked_at,
    })
  );

  const response: GeoOverviewResponse = {
    configured: isTinybirdConfigured(),
    engines,
    tracked: buildTrackedEngines(engines),
  };
  return response;
});

export const loadGeoTimeseries = Effect.fn("geo.timeseries")(function* (
  input: GeoScopeInput,
  days: number | undefined
) {
  const scope = yield* resolveGeoScope(input);
  const result = yield* geoQuery("timeseries query failed", () =>
    queryGeoTimeseries({
      ...geoScopeParams(scope),
      days,
    })
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
  input: GeoScopeInput
) {
  const scope = yield* resolveGeoScope(input);
  const result = yield* geoQuery("prompt results query failed", () =>
    queryGeoPromptResults({
      ...geoScopeParams(scope),
    })
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
  function* (input: GeoScopeInput, days: number | undefined) {
    const scope = yield* resolveGeoScope(input);
    const result = yield* geoQuery("competitor share query failed", () =>
      queryGeoCompetitorShare({
        ...geoScopeParams(scope),
        days,
        limit: GEO_COMPETITOR_SHARE_LIMIT,
      })
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
  function* (input: GeoScopeInput, brand: string, days: number | undefined) {
    const scope = yield* resolveGeoScope(input);
    const resolvedDays = days ?? GEO_COMPETITOR_DETAIL_DAYS;

    const [timeseries, prompts] = yield* Effect.all(
      [
        geoQuery("competitor timeseries query failed", () =>
          queryGeoCompetitorTimeseries({
            ...geoScopeParams(scope),
            brand,
            days: resolvedDays,
          })
        ),
        geoQuery("competitor prompts query failed", () =>
          queryGeoCompetitorPrompts({
            ...geoScopeParams(scope),
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
  input: GeoScopeInput,
  days: number | undefined,
  limit: number | undefined
) {
  const scope = yield* resolveGeoScope(input);
  const [usage, overview] = yield* Effect.all(
    [
      geoQuery("model usage query failed", () =>
        queryModelUsageLatest({
          source: GEO_MODEL_USAGE_SOURCE,
          limit: limit ?? GEO_MODEL_USAGE_DEFAULT_LIMIT,
        })
      ),
      geoQuery("overview query failed", () =>
        queryGeoOverview({
          ...geoScopeParams(scope),
          days,
        })
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
  input: GeoScopeInput,
  days: number | undefined
) {
  const scope = yield* resolveGeoScope(input);
  const resolvedDays = days ?? AI_TRAFFIC_DEFAULT_DAYS;

  const [overview, timeseries] = yield* Effect.all(
    [
      geoQuery("traffic overview query failed", () =>
        queryGeoTrafficOverview({
          ...geoScopeParams(scope),
          days: resolvedDays,
        })
      ),
      geoQuery("traffic timeseries query failed", () =>
        queryGeoTrafficTimeseries({
          ...geoScopeParams(scope),
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
  input: GeoScopeInput,
  limit: number | undefined,
  visitorTypes: readonly string[] | undefined,
  categories: readonly string[] | undefined
) {
  const scope = yield* resolveGeoScope(input);
  const log = yield* geoQuery("traffic log query failed", () =>
    queryGeoTrafficLog({
      ...geoScopeParams(scope),
      limit: limit ?? AI_TRAFFIC_DEFAULT_LOG_LIMIT,
      visitor_type: visitorTypes?.join(",") ?? "",
      category: categories?.join(",") ?? "",
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
    input: GeoScopeInput,
    days: number | undefined,
    limit: number | undefined
  ) {
    const scope = yield* resolveGeoScope(input);
    const journeys = yield* geoQuery("traffic journeys query failed", () =>
      queryGeoTrafficJourneys({
        ...geoScopeParams(scope),
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
  input: GeoScopeInput,
  journeyId: string,
  days: number | undefined
) {
  const scope = yield* resolveGeoScope(input);
  const detail = yield* geoQuery("journey detail query failed", () =>
    queryGeoJourneyDetail({
      ...geoScopeParams(scope),
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
  input: GeoScopeInput,
  days: number | undefined,
  limit: number | undefined,
  visitorType: string | undefined
) {
  const scope = yield* resolveGeoScope(input);
  const pages = yield* geoQuery("traffic pages query failed", () =>
    queryGeoTrafficPages({
      ...geoScopeParams(scope),
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
  input: GeoScopeInput
) {
  const scope = yield* resolveGeoScope(input);
  if (!scope.projectId) {
    const emptyResponse: GeoTrackedPromptsResponse = {
      configured: isTinybirdConfigured(),
      prompts: [],
    };
    return emptyResponse;
  }

  const projectId = scope.projectId;
  const [customRows, settingsRow, brand] = yield* Effect.all(
    [
      geoDb("prompts lookup failed", () =>
        db.query.geoPrompts.findMany({
          where: eq(geoPrompts.projectId, projectId),
          orderBy: [asc(geoPrompts.createdAt)],
        })
      ),
      geoDb("settings lookup failed", () =>
        db.query.geoSettings.findFirst({
          where: eq(geoSettings.projectId, projectId),
        })
      ),
      geoDb("brand lookup failed", () =>
        db.query.brandSettings.findFirst({
          columns: { companyDescription: true, audience: true },
          where: and(
            eq(brandSettings.organizationId, scope.organizationId),
            eq(brandSettings.isDefault, true)
          ),
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
  input: GeoScopeInput,
  prompt: string
) {
  const scope = yield* requireGeoProject(input);
  const projectId = scope.projectId;
  const rows = yield* geoDb("prompt create failed", () =>
    db
      .insert(geoPrompts)
      .values({
        id: crypto.randomUUID(),
        organizationId: scope.organizationId,
        projectId,
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
  input: GeoScopeInput
) {
  const scope = yield* requireGeoProject(input);
  const projectId = scope.projectId;
  const row = yield* geoDb("settings lookup failed", () =>
    db.query.geoSettings.findFirst({
      columns: { id: true, enabled: true },
      where: eq(geoSettings.projectId, projectId),
    })
  );

  if (!row) {
    return yield* Effect.fail(
      new GeoSettingsMissingError({ organizationId: scope.organizationId })
    );
  }

  if (!row.enabled) {
    return yield* Effect.fail(new GeoSettingsDisabledError({ projectId }));
  }

  return yield* withGeoScanStatus(
    projectId,
    Effect.tryPromise({
      try: () =>
        startGeoScanRun({ organizationId: scope.organizationId, projectId }),
      catch: (cause) => new GeoScanStartError({ cause }),
    }),
    { finishOn: "failure" }
  );
});
