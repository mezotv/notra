import { cachedExternalFetch } from "@notra/analytics/cache/query-cache";
import type { ModelUsageShareRow } from "@notra/analytics/tinybird/datasources";
import { Effect } from "effect";
import {
  GEO_MODEL_USAGE_CACHE_KEY,
  GEO_MODEL_USAGE_ENDPOINT,
  GEO_MODEL_USAGE_FETCH_TIMEOUT_MS,
  GEO_MODEL_USAGE_INGEST_LIMIT,
  GEO_MODEL_USAGE_MODELS_ENDPOINT,
  GEO_MODEL_USAGE_OTHER_KEY,
  GEO_MODEL_USAGE_OTHERS_LABEL,
  GEO_MODEL_USAGE_SLUGS_CACHE_KEY,
  GEO_MODEL_USAGE_SOURCE,
} from "@/constants/geo";
import { GeoScanError } from "@/lib/geo/errors";
import {
  openRouterModelsResponseSchema,
  openRouterRankingsChartSchema,
} from "@/schemas/geo";
import { GROUNDED_SUFFIX_PATTERN } from "@/utils/geo-presence";

const VARIANT_SUFFIX = /:[a-z0-9-]+$/;
const PREVIEW_SUFFIX = /-preview$/;

interface WeeklyTotal {
  model: string;
  tokens: number;
}

function normalizeModelId(value: string): string {
  return value
    .toLowerCase()
    .replace(GROUNDED_SUFFIX_PATTERN, "")
    .replace(VARIANT_SUFFIX, "")
    .replace(PREVIEW_SUFFIX, "");
}

function toCapturedAt(date: string): string {
  return `${date.slice(0, 10)} 00:00:00`;
}

const fetchJson = Effect.fn("geo.modelUsage.fetchJson")(function* (
  url: string,
  apiKey: string | null
) {
  const payload = yield* Effect.tryPromise({
    try: async () => {
      const response = await fetch(url, {
        headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {},
        signal: AbortSignal.timeout(GEO_MODEL_USAGE_FETCH_TIMEOUT_MS),
      });
      if (!response.ok) {
        throw new Error(`${url} responded with ${response.status}`);
      }
      return await response.json();
    },
    catch: (cause) =>
      new GeoScanError({ message: `Failed to fetch ${url}`, cause }),
  });
  return payload;
});

const fetchSlugMap = Effect.fn("geo.modelUsage.fetchSlugMap")(function* () {
  const payload = yield* Effect.tryPromise({
    try: () =>
      cachedExternalFetch(GEO_MODEL_USAGE_SLUGS_CACHE_KEY, () =>
        Effect.runPromise(fetchJson(GEO_MODEL_USAGE_MODELS_ENDPOINT, null))
      ),
    catch: (cause) =>
      new GeoScanError({ message: "Model list fetch failed", cause }),
  });
  const parsed = openRouterModelsResponseSchema.safeParse(payload);
  const slugs = new Map<string, string>();
  if (!parsed.success) {
    return slugs;
  }
  for (const model of parsed.data.data) {
    if (model.canonical_slug) {
      slugs.set(model.canonical_slug.toLowerCase(), model.id);
    }
  }
  return slugs;
});

function resolveModelId(permaslug: string, slugs: Map<string, string>): string {
  const base = permaslug.toLowerCase().replace(VARIANT_SUFFIX, "");
  return normalizeModelId(slugs.get(base) ?? base);
}

function buildRows(
  weeks: Map<string, WeeklyTotal[]>,
  slugs: Map<string, string>
): ModelUsageShareRow[] {
  const rows: ModelUsageShareRow[] = [];
  for (const [date, entries] of weeks) {
    const total = entries.reduce((sum, entry) => sum + entry.tokens, 0);
    if (total <= 0) {
      continue;
    }

    const byModel = new Map<string, number>();
    for (const entry of entries) {
      if (entry.model === GEO_MODEL_USAGE_OTHER_KEY) {
        continue;
      }
      const model = resolveModelId(entry.model, slugs);
      byModel.set(model, (byModel.get(model) ?? 0) + entry.tokens);
    }

    const ranked = [...byModel.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, GEO_MODEL_USAGE_INGEST_LIMIT);

    ranked.forEach(([model, tokens], index) => {
      rows.push({
        captured_at: toCapturedAt(date),
        source: GEO_MODEL_USAGE_SOURCE,
        model,
        rank: index + 1,
        share: tokens / total,
        raw_tokens: tokens,
      });
    });
  }
  return rows;
}

export const loadModelUsageRows = Effect.fn("geo.modelUsage.loadRows")(
  function* () {
    const payload = yield* Effect.tryPromise({
      try: () =>
        cachedExternalFetch(GEO_MODEL_USAGE_CACHE_KEY, () =>
          Effect.runPromise(fetchJson(GEO_MODEL_USAGE_ENDPOINT, null))
        ),
      catch: (cause) =>
        new GeoScanError({ message: "Model usage fetch failed", cause }),
    });
    const parsed = openRouterRankingsChartSchema.safeParse(payload);
    if (!parsed.success) {
      return yield* Effect.fail(
        new GeoScanError({
          message: "Model usage rankings response did not match the schema",
          cause: parsed.error,
        })
      );
    }

    const weeks = new Map<string, WeeklyTotal[]>();
    for (const point of parsed.data.data.data) {
      const bucket: WeeklyTotal[] = [];
      for (const [model, tokens] of Object.entries(point.ys)) {
        if (
          !Number.isFinite(tokens) ||
          model === GEO_MODEL_USAGE_OTHERS_LABEL
        ) {
          continue;
        }
        bucket.push({ model, tokens });
      }
      if (bucket.length > 0) {
        weeks.set(point.x, bucket);
      }
    }

    const slugs = yield* fetchSlugMap();
    const rows = buildRows(weeks, slugs);
    return rows;
  }
);
