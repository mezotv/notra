import { gateway } from "@notra/ai/gateway";
import { scrapeWebsiteForBrandAnalysis } from "@notra/ai/utils/context-dev";
import { db } from "@notra/db/drizzle";
import { geoPrompts, geoSettings } from "@notra/db/schema";
import { generateText, Output } from "ai";
import { eq } from "drizzle-orm";
import { Effect } from "effect";

import {
  GEO_DISCOVERY_ALIAS_LIMIT,
  GEO_DISCOVERY_CACHE_PREFIX,
  GEO_DISCOVERY_CACHE_TTL_SECONDS,
  GEO_DISCOVERY_COMPETITOR_LIMIT,
  GEO_DISCOVERY_MAX_ALIASES,
  GEO_DISCOVERY_MAX_BRANDED_PROMPTS,
  GEO_DISCOVERY_MAX_COMPETITORS,
  GEO_DISCOVERY_MAX_PROMPTS,
  GEO_DISCOVERY_MAX_TOKENS,
  GEO_DISCOVERY_MIN_COMPETITORS,
  GEO_DISCOVERY_MIN_PROMPTS,
  GEO_DISCOVERY_MODEL,
  GEO_DISCOVERY_SYSTEM_PROMPT,
  GEO_GAP_TITLE_MAX_LENGTH,
  GEO_PROMPT_MAX_LENGTH,
  GEO_PROMPT_MIN_LENGTH,
} from "@/constants/geo";
import { readGeoCache, writeGeoCache } from "@/lib/geo/cache";
import { competitorKey, normalizeCompetitorDomain } from "@/lib/geo/domain";
import { GeoDiscoveryError } from "@/lib/geo/errors";
import { syncGeoCompetitors } from "@/lib/geo/programs";
import { ensureGeoProject } from "@/lib/geo/projects";
import { withGeoScanStatus } from "@/lib/geo/scan-status";
import { startGeoScanRun } from "@/lib/workflows/start";
import { geoWebsiteDiscoverySchema } from "@/schemas/geo";
import type {
  GeoCompetitorSeed,
  GeoDiscoverWebsiteResult,
  GeoGenerateFromWebsiteResult,
  GeoScopeInput,
  GeoWebsiteDiscovery,
} from "@/types/geo";

const MIN_PROMPT_LENGTH = GEO_PROMPT_MIN_LENGTH;
const MAX_PROMPT_LENGTH = GEO_PROMPT_MAX_LENGTH;

function buildDiscoveryPrompt(url: string, content: string): string {
  const year = new Date().getFullYear();
  return `Website: ${url}

Website content:
"""
${content}
"""

Derive the brand tracking configuration for this company:

1. companyName: the company or product name exactly as it brands itself.
2. aliases: up to ${GEO_DISCOVERY_MAX_ALIASES} alternative spellings that identify this company - product names, the bare domain, and common misspellings. Never include generic words that could refer to anything else.
3. competitors: between ${GEO_DISCOVERY_MIN_COMPETITORS} and ${GEO_DISCOVERY_MAX_COMPETITORS} real, named companies or products that compete in the same category. For each one give its name and its bare website domain (for example "stripe.com"), or null for domain when you are not sure.
4. prompts: between ${GEO_DISCOVERY_MIN_PROMPTS} and ${GEO_DISCOVERY_MAX_PROMPTS} entries, each with a "prompt" and a "title".

Prompt rules:
- A prompt is the exact text a real buyer would type into an AI assistant (ChatGPT, Claude, Perplexity) while researching this category. Write it as one natural, grammatically correct question or search phrase with a single clear intent - for example "What tools should I use to automate my marketing", "Best Hootsuite alternative for small teams ${year}", or "How much does LinkedIn Premium cost".
- Never concatenate keywords, never mix languages within a prompt, and never write anything you would not plausibly type yourself. Read each prompt aloud before keeping it; if it sounds off, rewrite it.
- Cover different intents across the set: category recommendations ("best X for Y"), competitor alternatives, comparisons, pricing questions, and how-to or definition questions buyers ask on the way to a purchase. Append "${year}" only where a real person would (best-of, alternatives, pricing) - not on definitions or how-tos.
- At most ${GEO_DISCOVERY_MAX_BRANDED_PROMPTS} prompts may contain the company name; every other prompt must be unbranded and framed around the category, the problem or the buying decision, so the answer reveals whether an assistant recommends this company unprompted. Each prompt must be between ${MIN_PROMPT_LENGTH} and ${MAX_PROMPT_LENGTH} characters.

Title rules:
- The title is the headline of the article that would win this prompt: specific, publishable and in Title Case, following proven formats such as "Best {Category} Tools in ${year}: {Facets} Compared", "Best {Competitor} Alternatives for {Use Case} in ${year}", "{A} vs {B}: Features, Pricing & Which to Choose in ${year}", "{Product} Pricing: Plans & Cost Breakdown for ${year}", "How to {Task} (Step-by-Step ${year})", or "What Is {Term}? Definition, Examples & How to Measure It".
- Write titles in the same language as the prompt and keep each under ${GEO_GAP_TITLE_MAX_LENGTH} characters.`;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function unionValues(
  existing: string[],
  extracted: string[],
  limit: number
): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const value of [...existing, ...extracted]) {
    const trimmed = value.trim();
    const key = normalizeKey(trimmed);
    if (!trimmed || seen.has(key) || merged.length >= limit) {
      continue;
    }
    seen.add(key);
    merged.push(trimmed);
  }
  return merged;
}

function buildCompetitorSeeds(
  names: string[],
  discovered: readonly GeoCompetitorSeed[]
): GeoCompetitorSeed[] {
  const domains = new Map<string, string | null>();
  for (const entry of discovered) {
    const domain = entry.domain
      ? normalizeCompetitorDomain(entry.domain)
      : null;
    domains.set(competitorKey(entry.name), domain);
  }
  return names.map((name) => ({
    name,
    domain: domains.get(competitorKey(name)) ?? null,
  }));
}

const scrapeWebsite = Effect.fn("geo.discover.scrape")(function* (url: string) {
  const result = yield* Effect.tryPromise({
    try: () => scrapeWebsiteForBrandAnalysis(url),
    catch: (cause) =>
      new GeoDiscoveryError({ message: "Failed to scrape the website", cause }),
  });

  if (!result.success) {
    return yield* Effect.fail(new GeoDiscoveryError({ message: result.error }));
  }

  return result.content;
});

const extractDiscovery = Effect.fn("geo.discover.extract")(function* (
  organizationId: string,
  url: string,
  content: string
) {
  const result = yield* Effect.tryPromise({
    try: () =>
      generateText({
        model: gateway(GEO_DISCOVERY_MODEL, { organizationId }),
        output: Output.object({ schema: geoWebsiteDiscoverySchema }),
        prompt: buildDiscoveryPrompt(url, content),
        system: GEO_DISCOVERY_SYSTEM_PROMPT,
        maxOutputTokens: GEO_DISCOVERY_MAX_TOKENS,
      }),
    catch: (cause) =>
      new GeoDiscoveryError({
        message: "Failed to analyze the website",
        cause,
      }),
  });

  const discovery: GeoWebsiteDiscovery = result.output;
  return discovery;
});

function discoveryCacheKey(organizationId: string, url: string): string {
  return `${GEO_DISCOVERY_CACHE_PREFIX}:${organizationId}:${url}`;
}

export const discoverGeoWebsite = Effect.fn("geo.discoverWebsite")(function* (
  organizationId: string,
  url: string
) {
  const cacheKey = discoveryCacheKey(organizationId, url);
  const cached = yield* readGeoCache(cacheKey, geoWebsiteDiscoverySchema);
  if (cached) {
    const result: GeoDiscoverWebsiteResult = { url, discovery: cached };
    return result;
  }
  const content = yield* scrapeWebsite(url);
  const discovery = yield* extractDiscovery(organizationId, url, content);
  yield* writeGeoCache(cacheKey, discovery, GEO_DISCOVERY_CACHE_TTL_SECONDS);
  const result: GeoDiscoverWebsiteResult = { url, discovery };
  return result;
});

export const generateGeoFromWebsite = Effect.fn("geo.generateFromWebsite")(
  function* (scopeInput: GeoScopeInput, url: string) {
    const organizationId = scopeInput.organizationId;
    const { discovery } = yield* discoverGeoWebsite(organizationId, url);

    const projectId = yield* ensureGeoProject(
      scopeInput,
      discovery.companyName
    ).pipe(
      Effect.catchTags({
        GeoDatabaseError: (error) =>
          Effect.fail(
            new GeoDiscoveryError({
              message: "Failed to resolve the project",
              cause: error,
            })
          ),
        GeoProjectCreateFailedError: (error) =>
          Effect.fail(
            new GeoDiscoveryError({
              message: "Failed to create the project",
              cause: error,
            })
          ),
        GeoProjectNotFoundError: (error) =>
          Effect.fail(
            new GeoDiscoveryError({
              message: "Project not found",
              cause: error,
            })
          ),
      })
    );

    const existing = yield* Effect.tryPromise({
      try: () =>
        db.query.geoSettings.findFirst({
          where: eq(geoSettings.projectId, projectId),
        }),
      catch: (cause) =>
        new GeoDiscoveryError({
          message: "Failed to load GEO settings",
          cause,
        }),
    });

    const aliases = unionValues(
      existing?.aliases ?? [],
      discovery.aliases,
      GEO_DISCOVERY_ALIAS_LIMIT
    );
    const competitors = unionValues(
      existing?.competitors ?? [],
      discovery.competitors.map((entry) => entry.name),
      GEO_DISCOVERY_COMPETITOR_LIMIT
    );
    const companyName = existing?.companyName ?? discovery.companyName;

    yield* Effect.tryPromise({
      try: () =>
        db
          .insert(geoSettings)
          .values({
            id: crypto.randomUUID(),
            organizationId,
            projectId,
            companyName,
            aliases,
            competitors,
            enabled: true,
          })
          .onConflictDoUpdate({
            target: geoSettings.projectId,
            set: { companyName, aliases, competitors },
          }),
      catch: (cause) =>
        new GeoDiscoveryError({
          message: "Failed to save GEO settings",
          cause,
        }),
    });

    yield* syncGeoCompetitors(
      organizationId,
      projectId,
      buildCompetitorSeeds(competitors, discovery.competitors)
    );

    const existingPrompts = yield* Effect.tryPromise({
      try: () =>
        db.query.geoPrompts.findMany({
          columns: { prompt: true },
          where: eq(geoPrompts.projectId, projectId),
        }),
      catch: (cause) =>
        new GeoDiscoveryError({ message: "Failed to load GEO prompts", cause }),
    });

    const seen = new Set(
      existingPrompts.map((row) => normalizeKey(row.prompt))
    );
    const values: {
      id: string;
      organizationId: string;
      projectId: string;
      prompt: string;
      title: string | null;
    }[] = [];
    for (const entry of discovery.prompts) {
      const trimmed = entry.prompt.trim();
      const title = entry.title.trim().slice(0, GEO_GAP_TITLE_MAX_LENGTH);
      const key = normalizeKey(trimmed);
      if (
        trimmed.length < MIN_PROMPT_LENGTH ||
        trimmed.length > MAX_PROMPT_LENGTH ||
        seen.has(key)
      ) {
        continue;
      }
      seen.add(key);
      values.push({
        id: crypto.randomUUID(),
        organizationId,
        projectId,
        prompt: trimmed,
        title: title.length > 0 ? title : null,
      });
    }

    if (values.length > 0) {
      yield* Effect.tryPromise({
        try: () => db.insert(geoPrompts).values(values),
        catch: (cause) =>
          new GeoDiscoveryError({
            message: "Failed to save GEO prompts",
            cause,
          }),
      });
    }

    const summary: GeoGenerateFromWebsiteResult = {
      companyName,
      aliases,
      competitors,
      promptsAdded: values.length,
    };

    // Newly created settings default to enabled; an existing disabled row is
    // left alone so we never stamp a scan start that the scan will skip.
    const scanEnabled = existing?.enabled ?? true;
    if (scanEnabled) {
      yield* withGeoScanStatus(
        projectId,
        Effect.tryPromise({
          try: () => startGeoScanRun({ organizationId, projectId }),
          catch: (cause) =>
            new GeoDiscoveryError({
              message: "Failed to start GEO scan",
              cause,
            }),
        }),
        { finishOn: "failure" }
      ).pipe(
        Effect.catch((error) => {
          console.error(
            "[GEO] Failed to start scan after website generate:",
            error
          );
          return Effect.void;
        })
      );
    }

    return summary;
  }
);
