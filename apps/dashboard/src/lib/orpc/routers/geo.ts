import {
  isTinybirdConfigured,
  queryAiTrafficLog,
  queryAiTrafficOverview,
  queryAiTrafficTimeseries,
  queryGeoCompetitorShare,
  queryGeoLanguageShare,
  queryGeoOverview,
  queryGeoPromptResults,
  queryGeoTimeseries,
  queryModelUsageLatest,
} from "@notra/analytics/tinybird/client";
import { db } from "@notra/db/drizzle";
import { brandSettings, geoPrompts, geoSettings } from "@notra/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { Effect } from "effect";
import {
  AI_TRAFFIC_DEFAULT_DAYS,
  AI_TRAFFIC_DEFAULT_LOG_LIMIT,
  GEO_ENGINE_LABELS,
  GEO_MODEL_USAGE_ATTRIBUTION,
  GEO_MODEL_USAGE_DEFAULT_LIMIT,
  GEO_MODEL_USAGE_SOURCE,
} from "@/constants/geo";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { buildBeaconIngestUrl, buildBeaconSnippet } from "@/lib/beacon/snippet";
import { deriveBeaconToken } from "@/lib/beacon/token";
import { generateGeoFromWebsite } from "@/lib/geo/discover";
import type { GeoDiscoveryError } from "@/lib/geo/errors";
import { normalizeModelId } from "@/lib/geo/model-usage";
import { buildGeoPrompts } from "@/lib/geo/prompts";
import { authorizedProcedure } from "@/lib/orpc/base";
import { badRequest, notFound } from "@/lib/orpc/utils/errors";
import { startGeoScanRun } from "@/lib/workflows/start";
import {
  aiTrafficInputSchema,
  geoGenerateFromWebsiteInputSchema,
  geoModelUsageInputSchema,
  geoOrganizationInputSchema,
  geoPromptCreateInputSchema,
  geoPromptDeleteInputSchema,
  geoPromptToggleInputSchema,
  geoSettingsUpsertInputSchema,
  geoTimeseriesInputSchema,
} from "@/schemas/geo";
import type {
  AiTrafficResponse,
  BeaconSetupResponse,
  GeoCompetitorShareResponse,
  GeoGenerateFromWebsiteResult,
  GeoLanguageShareResponse,
  GeoModelUsageResponse,
  GeoModelUsageRow,
  GeoOverviewResponse,
  GeoPromptResultsResponse,
  GeoPromptRow,
  GeoSettings,
  GeoSettingsResponse,
  GeoTimeseriesResponse,
  GeoTrackedPrompt,
  GeoTrackedPromptsResponse,
} from "@/types/geo";

interface GeoSettingsRow {
  id: string;
  organizationId: string;
  companyName: string;
  aliases: string[];
  competitors: string[];
  languages: string[] | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toGeoSettings(row: GeoSettingsRow): GeoSettings {
  return {
    id: row.id,
    organizationId: row.organizationId,
    companyName: row.companyName,
    aliases: row.aliases,
    competitors: row.competitors,
    languages: row.languages ?? [],
    enabled: row.enabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toTrackedPrompt(row: GeoPromptRow): GeoTrackedPrompt {
  return {
    id: row.id,
    prompt: row.prompt,
    enabled: row.enabled,
    source: "custom",
    createdAt: row.createdAt.toISOString(),
  };
}

function toNullableNumber(value: number | bigint | null): number | null {
  if (value === null) {
    return null;
  }
  return Number(value);
}

interface EngineCoverage {
  mentions: number;
  checks: number;
}

function buildCoverageByModel(
  rows: { engine: string; mentions: number | bigint; checks: number | bigint }[]
): Map<string, EngineCoverage> {
  const coverage = new Map<string, EngineCoverage>();
  for (const row of rows) {
    const model = normalizeModelId(row.engine);
    const entry = coverage.get(model) ?? { mentions: 0, checks: 0 };
    entry.mentions += Number(row.mentions);
    entry.checks += Number(row.checks);
    coverage.set(model, entry);
  }
  return coverage;
}

function toModelUsageRow(
  model: string,
  rank: number | bigint,
  share: number,
  rawTokens: number | bigint | null,
  coverage: EngineCoverage | undefined
): GeoModelUsageRow {
  const checks = coverage?.checks ?? 0;
  return {
    model,
    label: GEO_ENGINE_LABELS[model] ?? model,
    rank: Number(rank),
    share,
    rawTokens: rawTokens === null ? null : Number(rawTokens),
    scanned: checks > 0,
    mentionRate: checks > 0 ? (coverage?.mentions ?? 0) / checks : null,
    checks,
  };
}
export const geoRouter = {
  settings: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(async ({ context, input }): Promise<GeoSettingsResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const row = await db.query.geoSettings.findFirst({
        where: eq(geoSettings.organizationId, input.organizationId),
      });

      return {
        configured: isTinybirdConfigured(),
        settings: row ? toGeoSettings(row) : null,
      };
    }),
  settingsUpsert: authorizedProcedure
    .input(geoSettingsUpsertInputSchema)
    .handler(async ({ context, input }): Promise<GeoSettingsResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const [row] = await db
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
        .returning();

      return {
        configured: isTinybirdConfigured(),
        settings: row ? toGeoSettings(row) : null,
      };
    }),
  languageShare: authorizedProcedure
    .input(geoTimeseriesInputSchema)
    .handler(async ({ context, input }): Promise<GeoLanguageShareResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const result = await queryGeoLanguageShare({
        organization_id: input.organizationId,
        days: input.days,
      }).catch((error) => {
        console.error("[GEO] language share query failed:", error);
        return null;
      });

      return {
        configured: isTinybirdConfigured(),
        points: (result?.data ?? []).map((row) => ({
          language: row.language_name,
          checks: Number(row.checks),
          mentions: Number(row.mentions),
          mentionRate: Number(row.mention_rate),
          avgPosition: toNullableNumber(row.avg_position),
        })),
      };
    }),
  overview: authorizedProcedure
    .input(geoTimeseriesInputSchema)
    .handler(async ({ context, input }): Promise<GeoOverviewResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const result = await queryGeoOverview({
        organization_id: input.organizationId,
        days: input.days,
      }).catch((error) => {
        console.error("[GEO] overview query failed:", error);
        return null;
      });

      return {
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
    }),
  timeseries: authorizedProcedure
    .input(geoTimeseriesInputSchema)
    .handler(async ({ context, input }): Promise<GeoTimeseriesResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const result = await queryGeoTimeseries({
        organization_id: input.organizationId,
        days: input.days,
      }).catch((error) => {
        console.error("[GEO] timeseries query failed:", error);
        return null;
      });

      return {
        configured: isTinybirdConfigured(),
        points: (result?.data ?? []).map((row) => ({
          day: row.day,
          engine: row.engine,
          checks: Number(row.checks),
          mentions: Number(row.mentions),
        })),
      };
    }),
  promptResults: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(async ({ context, input }): Promise<GeoPromptResultsResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const result = await queryGeoPromptResults({
        organization_id: input.organizationId,
      }).catch((error) => {
        console.error("[GEO] prompt results query failed:", error);
        return null;
      });

      return {
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
    }),
  competitorShare: authorizedProcedure
    .input(geoTimeseriesInputSchema)
    .handler(
      async ({ context, input }): Promise<GeoCompetitorShareResponse> => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
        });

        const result = await queryGeoCompetitorShare({
          organization_id: input.organizationId,
          days: input.days,
        }).catch((error) => {
          console.error("[GEO] competitor share query failed:", error);
          return null;
        });

        return {
          configured: isTinybirdConfigured(),
          points: (result?.data ?? []).map((row) => ({
            brand: row.brand,
            mentions: Number(row.mentions),
          })),
        };
      }
    ),
  modelUsage: authorizedProcedure
    .input(geoModelUsageInputSchema)
    .handler(async ({ context, input }): Promise<GeoModelUsageResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const [usage, overview] = await Promise.all([
        queryModelUsageLatest({
          source: GEO_MODEL_USAGE_SOURCE,
          limit: input.limit ?? GEO_MODEL_USAGE_DEFAULT_LIMIT,
        }).catch((error) => {
          console.error("[GEO] model usage query failed:", error);
          return null;
        }),
        queryGeoOverview({
          organization_id: input.organizationId,
          days: input.days,
        }).catch((error) => {
          console.error("[GEO] overview query failed:", error);
          return null;
        }),
      ]);

      const coverage = buildCoverageByModel(overview?.data ?? []);
      const rows = usage?.data ?? [];

      return {
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
    }),
  aiTraffic: authorizedProcedure
    .input(aiTrafficInputSchema)
    .handler(async ({ context, input }): Promise<AiTrafficResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const days = input.days ?? AI_TRAFFIC_DEFAULT_DAYS;
      const limit = input.limit ?? AI_TRAFFIC_DEFAULT_LOG_LIMIT;

      const [overview, timeseries, log] = await Promise.all([
        queryAiTrafficOverview({
          organization_id: input.organizationId,
          days,
        }).catch((error) => {
          console.error("[BEACON] ai traffic overview query failed:", error);
          return null;
        }),
        queryAiTrafficTimeseries({
          organization_id: input.organizationId,
          days,
        }).catch((error) => {
          console.error("[BEACON] ai traffic timeseries query failed:", error);
          return null;
        }),
        queryAiTrafficLog({
          organization_id: input.organizationId,
          limit,
        }).catch((error) => {
          console.error("[BEACON] ai traffic log query failed:", error);
          return null;
        }),
      ]);

      return {
        configured: isTinybirdConfigured(),
        agents: (overview?.data ?? []).map((row) => ({
          agent: row.agent,
          category: row.category,
          confidence: row.confidence,
          hits: Number(row.hits),
          paths: Number(row.paths),
          lastSeenAt: row.last_seen_at,
        })),
        points: (timeseries?.data ?? []).map((row) => ({
          day: row.day,
          category: row.category,
          hits: Number(row.hits),
        })),
        log: (log?.data ?? []).map((row) => ({
          capturedAt: row.captured_at,
          agent: row.agent,
          category: row.category,
          confidence: row.confidence,
          path: row.path,
          method: row.method,
          referer: row.referer,
        })),
      };
    }),
  beaconSetup: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(async ({ context, input }): Promise<BeaconSetupResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const ingestUrl = buildBeaconIngestUrl();

      return {
        ingestUrl,
        token: deriveBeaconToken(input.organizationId) ?? "",
        snippet: buildBeaconSnippet(ingestUrl, input.organizationId),
      };
    }),
  promptsList: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(async ({ context, input }): Promise<GeoTrackedPromptsResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const [customRows, settingsRow] = await Promise.all([
        db.query.geoPrompts.findMany({
          where: eq(geoPrompts.organizationId, input.organizationId),
          orderBy: [asc(geoPrompts.createdAt)],
        }),
        db.query.geoSettings.findFirst({
          where: eq(geoSettings.organizationId, input.organizationId),
        }),
      ]);

      const prompts: GeoTrackedPrompt[] = customRows.map(toTrackedPrompt);

      if (!settingsRow) {
        return { configured: isTinybirdConfigured(), prompts };
      }

      const brand = await db.query.brandSettings.findFirst({
        columns: { companyDescription: true, audience: true },
        where: and(
          eq(brandSettings.organizationId, input.organizationId),
          eq(brandSettings.isDefault, true)
        ),
      });

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

      return { configured: isTinybirdConfigured(), prompts };
    }),
  promptsCreate: authorizedProcedure
    .input(geoPromptCreateInputSchema)
    .handler(async ({ context, input }): Promise<GeoTrackedPrompt> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const [row] = await db
        .insert(geoPrompts)
        .values({
          id: crypto.randomUUID(),
          organizationId: input.organizationId,
          prompt: input.prompt,
        })
        .returning();

      if (!row) {
        throw badRequest("Failed to create prompt");
      }

      return toTrackedPrompt(row);
    }),
  promptsDelete: authorizedProcedure
    .input(geoPromptDeleteInputSchema)
    .handler(async ({ context, input }): Promise<{ success: boolean }> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const [row] = await db
        .delete(geoPrompts)
        .where(
          and(
            eq(geoPrompts.id, input.promptId),
            eq(geoPrompts.organizationId, input.organizationId)
          )
        )
        .returning();

      if (!row) {
        throw notFound("Prompt not found");
      }

      return { success: true };
    }),
  promptsToggle: authorizedProcedure
    .input(geoPromptToggleInputSchema)
    .handler(async ({ context, input }): Promise<GeoTrackedPrompt> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const [row] = await db
        .update(geoPrompts)
        .set({ enabled: input.enabled })
        .where(
          and(
            eq(geoPrompts.id, input.promptId),
            eq(geoPrompts.organizationId, input.organizationId)
          )
        )
        .returning();

      if (!row) {
        throw notFound("Prompt not found");
      }

      return toTrackedPrompt(row);
    }),
  generateFromWebsite: authorizedProcedure
    .input(geoGenerateFromWebsiteInputSchema)
    .handler(
      async ({ context, input }): Promise<GeoGenerateFromWebsiteResult> => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
        });

        const outcome = await Effect.runPromise(
          Effect.result(generateGeoFromWebsite(input.organizationId, input.url))
        );

        if (outcome._tag === "Failure") {
          const failure: GeoDiscoveryError = outcome.failure;
          console.error("[GEO] website discovery failed:", failure);
          throw badRequest(failure.message);
        }

        return outcome.success;
      }
    ),
  startScan: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(async ({ context, input }): Promise<{ runId: string }> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const row = await db.query.geoSettings.findFirst({
        columns: { id: true },
        where: eq(geoSettings.organizationId, input.organizationId),
      });
      if (!row) {
        throw badRequest("Configure your brand tracking settings first");
      }

      return await startGeoScanRun({ organizationId: input.organizationId });
    }),
};
