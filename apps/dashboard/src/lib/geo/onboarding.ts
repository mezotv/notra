import { extractCompetitors, searchBrands } from "@notra/ai/utils/context-dev";
import { db } from "@notra/db/drizzle";
import { geoPrompts } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import { Effect } from "effect";

import {
  GEO_COMPETITOR_SUGGESTIONS_CACHE_PREFIX,
  GEO_DISCOVERY_CACHE_TTL_SECONDS,
  GEO_GAP_TITLE_MAX_LENGTH,
  GEO_ONBOARDING_SUGGESTED_COMPETITORS,
  GEO_SCAN_DEFAULT_INTERVAL_HOURS,
} from "@/constants/geo";
import { readGeoCache, writeGeoCache } from "@/lib/geo/cache";
import { discoverGeoWebsite } from "@/lib/geo/discover";
import { normalizeCompetitorDomain } from "@/lib/geo/domain";
import { geoDb } from "@/lib/geo/effect";
import { GeoDiscoveryError, GeoSettingsMissingError } from "@/lib/geo/errors";
import { loadGeoModelCatalog } from "@/lib/geo/model-catalog";
import { upsertGeoSettings } from "@/lib/geo/programs";
import { promptKey } from "@/lib/geo/prompt-key";
import { geoCompetitorSuggestionsResponseSchema } from "@/schemas/geo";
import type {
  GeoBrandSearchResponse,
  GeoCompetitorSuggestionsResponse,
  GeoOnboardingBrandInput,
  GeoOnboardingBrandResult,
  GeoScopeInput,
} from "@/types/geo";
import { resolveTrackedEngines } from "@/utils/geo-engines";
import { trackedGeoLanguages } from "@/utils/geo-language-rows";
import { normalizeWebsiteUrl } from "@/utils/geo-website";

export const saveGeoOnboardingBrand = Effect.fn("geo.onboardingBrand")(
  function* (input: GeoOnboardingBrandInput) {
    const organizationId = input.organizationId;
    const catalog = yield* Effect.promise(() =>
      loadGeoModelCatalog(organizationId)
    );

    const saved = yield* upsertGeoSettings({
      organizationId,
      projectId: input.projectId,
      companyName: input.companyName,
      aliases: input.aliases,
      competitors: [],
      languages: trackedGeoLanguages(input.languages ?? []),
      engines: resolveTrackedEngines(catalog, input.engines),
      enforceZdr: input.enforceZdr ?? true,
      nonZdrApprovedEngines: input.nonZdrApprovedEngines ?? [],
      enabled: true,
      scanIntervalHours: GEO_SCAN_DEFAULT_INTERVAL_HOURS,
    });

    const settings = saved.settings;
    if (!settings) {
      return yield* Effect.fail(
        new GeoSettingsMissingError({ organizationId })
      );
    }

    const projectId = settings.projectId;

    const existingPrompts = yield* geoDb("prompts lookup failed", () =>
      db.query.geoPrompts.findMany({
        columns: { prompt: true },
        where: eq(geoPrompts.projectId, projectId),
      })
    );
    const seen = new Set(existingPrompts.map((row) => promptKey(row.prompt)));
    const values = input.prompts.flatMap((entry) => {
      const prompt = entry.prompt.trim();
      const title = entry.title.trim().slice(0, GEO_GAP_TITLE_MAX_LENGTH);
      const key = promptKey(prompt);
      if (seen.has(key)) {
        return [];
      }
      seen.add(key);
      return [
        {
          id: crypto.randomUUID(),
          organizationId,
          projectId,
          prompt,
          title: title.length > 0 ? title : null,
        },
      ];
    });

    if (values.length > 0) {
      yield* geoDb("prompts insert failed", () =>
        db.insert(geoPrompts).values(values)
      );
    }

    const result: GeoOnboardingBrandResult = {
      projectId,
      companyName: settings.companyName,
      promptsAdded: values.length,
    };
    return result;
  }
);

function suggestionsCacheKey(organizationId: string, domain: string): string {
  return `${GEO_COMPETITOR_SUGGESTIONS_CACHE_PREFIX}:${organizationId}:${domain}`;
}

export const suggestGeoCompetitors = Effect.fn("geo.competitorSuggestions")(
  function* (scope: GeoScopeInput, domain: string) {
    const cacheKey = suggestionsCacheKey(scope.organizationId, domain);
    const cached = yield* readGeoCache(
      cacheKey,
      geoCompetitorSuggestionsResponseSchema
    );
    if (cached) {
      return cached;
    }

    const response = yield* Effect.tryPromise({
      try: () =>
        extractCompetitors(domain, GEO_ONBOARDING_SUGGESTED_COMPETITORS),
      catch: (cause) =>
        new GeoDiscoveryError({
          message: "Failed to find competitors for that website",
          cause,
        }),
    });

    const seen = new Set<string>();
    const result: GeoCompetitorSuggestionsResponse = {
      domain: response.domain,
      field: response.target?.field ?? null,
      competitors: response.competitors.flatMap((entry) => {
        const name = entry.name.trim();
        const competitorDomain = normalizeCompetitorDomain(entry.domain);
        const key = competitorDomain ?? name.toLowerCase();
        if (!name || seen.has(key)) {
          return [];
        }
        seen.add(key);
        return [
          {
            name,
            domain: competitorDomain,
            description: entry.description?.trim() || null,
            confidence: entry.confidence ?? null,
          },
        ];
      }),
    };
    yield* writeGeoCache(cacheKey, result, GEO_DISCOVERY_CACHE_TTL_SECONDS);
    return result;
  }
);

export async function warmGeoOnboardingCache(
  organizationId: string,
  websiteUrl: string
): Promise<void> {
  const url = normalizeWebsiteUrl(websiteUrl);
  const domain = normalizeCompetitorDomain(websiteUrl);
  const tasks: Promise<unknown>[] = [];
  if (url) {
    tasks.push(Effect.runPromise(discoverGeoWebsite(organizationId, url)));
  }
  if (domain) {
    tasks.push(
      Effect.runPromise(suggestGeoCompetitors({ organizationId }, domain))
    );
  }
  const results = await Promise.allSettled(tasks);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[GEO] Onboarding cache warm-up failed:", result.reason);
    }
  }
}

export const searchGeoBrands = Effect.fn("geo.brandSearch")(function* (
  _scope: GeoScopeInput,
  query: string
) {
  const response = yield* Effect.tryPromise({
    try: () => searchBrands(query),
    catch: (cause) =>
      new GeoDiscoveryError({ message: "Brand search failed", cause }),
  });

  const seen = new Set<string>();
  const result: GeoBrandSearchResponse = {
    results: response.results.flatMap((entry) => {
      const domain = normalizeCompetitorDomain(entry.domain);
      if (!domain || seen.has(domain)) {
        return [];
      }
      seen.add(domain);
      return [
        {
          domain,
          name: entry.name.trim() || domain,
          logo: entry.logo || null,
        },
      ];
    }),
  };
  return result;
});
