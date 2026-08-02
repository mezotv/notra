import { ingestModelUsageShare } from "@notra/analytics/tinybird/client";
import type { ModelUsageShareRow } from "@notra/analytics/tinybird/datasources";
import { Effect } from "effect";
import {
  GEO_MODEL_USAGE_API_KEY_ENV,
  GEO_MODEL_USAGE_ENDPOINT,
  GEO_MODEL_USAGE_FETCH_TIMEOUT_MS,
  GEO_MODEL_USAGE_INGEST_LIMIT,
  GEO_MODEL_USAGE_MODELS_ENDPOINT,
  GEO_MODEL_USAGE_OTHER_KEY,
  GEO_MODEL_USAGE_PERIOD,
  GEO_MODEL_USAGE_SOURCE,
} from "@/constants/geo";
import { GeoScanError } from "@/lib/geo/errors";
import {
  openRouterModelsResponseSchema,
  openRouterRankingsResponseSchema,
} from "@/schemas/geo";
import type { GeoModelUsageSnapshot } from "@/types/geo";

const VARIANT_SUFFIX = /:[a-z0-9-]+$/;
const PREVIEW_SUFFIX = /-preview$/;
const GROUNDED_SUFFIX = /(-direct)?-grounded$/;

interface WeeklyTotal {
  model: string;
  tokens: number;
}

export function normalizeModelId(value: string): string {
  return value
    .toLowerCase()
    .replace(GROUNDED_SUFFIX, "")
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
  const payload = yield* fetchJson(GEO_MODEL_USAGE_MODELS_ENDPOINT, null);
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

export const captureModelUsageShare = Effect.fn("geo.captureModelUsageShare")(
  function* () {
    const apiKey = process.env[GEO_MODEL_USAGE_API_KEY_ENV];
    if (!apiKey) {
      const skipped: GeoModelUsageSnapshot = { status: "skipped" };
      return skipped;
    }

    const payload = yield* fetchJson(
      `${GEO_MODEL_USAGE_ENDPOINT}?period=${GEO_MODEL_USAGE_PERIOD}`,
      apiKey
    );
    const parsed = openRouterRankingsResponseSchema.safeParse(payload);
    if (!parsed.success) {
      return yield* Effect.fail(
        new GeoScanError({
          message: "Model usage rankings response did not match the schema",
          cause: parsed.error,
        })
      );
    }

    const weeks = new Map<string, WeeklyTotal[]>();
    for (const entry of parsed.data.data) {
      const tokens = Number(entry.total_tokens);
      if (!Number.isFinite(tokens)) {
        continue;
      }
      const bucket = weeks.get(entry.date) ?? [];
      bucket.push({ model: entry.model_permaslug, tokens });
      weeks.set(entry.date, bucket);
    }

    const slugs = yield* fetchSlugMap();
    const rows = buildRows(weeks, slugs);

    if (rows.length === 0) {
      const skipped: GeoModelUsageSnapshot = { status: "skipped" };
      return skipped;
    }

    yield* Effect.tryPromise({
      try: () => ingestModelUsageShare(rows),
      catch: (cause) =>
        new GeoScanError({ message: "Failed to ingest model usage", cause }),
    });

    const captured: GeoModelUsageSnapshot = {
      status: "captured",
      models: rows.length,
      capturedAt: parsed.data.meta.as_of,
    };
    return captured;
  }
);
