import {
  EMPTY_GEO_CHECK_GROUNDING,
  GEO_CHECK_GROUNDING_MAX_QUERIES,
  GEO_CHECK_GROUNDING_MAX_SOURCES,
} from "@notra/db/constants/geo-checks";
import type {
  GeoCheckGrounding,
  GeoCheckSource,
} from "@notra/db/types/geo-checks";

import type { GeoGenerateTrace } from "../types/geo";
import { perplexitySourcesFromExcerpt } from "../utils/geo-perplexity-sources";
import { getReferenceDomain } from "../utils/reference-display";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addQuery(queries: string[], seen: Set<string>, value: unknown): void {
  if (typeof value !== "string") {
    return;
  }
  const query = value.trim();
  if (query.length === 0 || seen.has(query)) {
    return;
  }
  seen.add(query);
  queries.push(query);
}

function addSource(
  sources: GeoCheckSource[],
  seen: Set<string>,
  value: unknown
): void {
  if (!isRecord(value)) {
    return;
  }

  const url = typeof value.url === "string" ? value.url.trim() : "";
  const domain = getReferenceDomain(url);
  if (!domain || seen.has(url)) {
    return;
  }

  seen.add(url);
  const title =
    typeof value.title === "string" && value.title.trim().length > 0
      ? value.title.trim()
      : domain;
  sources.push({ title, url, domain });
}

function collectToolInputs(
  toolCalls: readonly unknown[] | undefined,
  queries: string[],
  seenQueries: Set<string>
): void {
  for (const call of toolCalls ?? []) {
    if (!isRecord(call)) {
      continue;
    }
    const input = call.input;
    if (!isRecord(input)) {
      continue;
    }
    addQuery(
      queries,
      seenQueries,
      input.query ?? input.q ?? input.search_query
    );
  }
}

function collectToolOutputs(
  toolResults: readonly unknown[] | undefined,
  queries: string[],
  seenQueries: Set<string>,
  sources: GeoCheckSource[],
  seenUrls: Set<string>
): void {
  for (const result of toolResults ?? []) {
    if (!isRecord(result)) {
      continue;
    }
    if (isRecord(result.input)) {
      addQuery(
        queries,
        seenQueries,
        result.input.query ?? result.input.q ?? result.input.search_query
      );
    }
    const output = result.output;
    const outputs = Array.isArray(output) ? output : [output];
    for (const item of outputs) {
      if (!isRecord(item)) {
        continue;
      }
      if (isRecord(item.action)) {
        addQuery(queries, seenQueries, item.action.query);
      }
      addQuery(queries, seenQueries, item.query);
      addSource(sources, seenUrls, item);

      const listed = item.sources ?? item.results;
      if (!Array.isArray(listed)) {
        continue;
      }
      for (const source of listed) {
        addSource(sources, seenUrls, source);
      }
    }
  }
}

function collectProviderMetadata(
  providerMetadata: unknown,
  queries: string[],
  seenQueries: Set<string>,
  sources: GeoCheckSource[],
  seenUrls: Set<string>
): void {
  if (!isRecord(providerMetadata)) {
    return;
  }

  for (const metadata of Object.values(providerMetadata)) {
    if (!isRecord(metadata) || !isRecord(metadata.groundingMetadata)) {
      continue;
    }
    const grounding = metadata.groundingMetadata;
    for (const query of Array.isArray(grounding.webSearchQueries)
      ? grounding.webSearchQueries
      : []) {
      addQuery(queries, seenQueries, query);
    }
    for (const chunk of Array.isArray(grounding.groundingChunks)
      ? grounding.groundingChunks
      : []) {
      if (!isRecord(chunk)) {
        continue;
      }
      if (isRecord(chunk.web)) {
        addSource(sources, seenUrls, {
          title: chunk.web.title,
          url: chunk.web.uri,
        });
      }
      if (isRecord(chunk.image)) {
        addSource(sources, seenUrls, {
          title: chunk.image.title,
          url: chunk.image.sourceUri,
        });
      }
      if (isRecord(chunk.retrievedContext)) {
        addSource(sources, seenUrls, {
          title: chunk.retrievedContext.title,
          url: chunk.retrievedContext.uri,
        });
      }
      if (isRecord(chunk.maps)) {
        addSource(sources, seenUrls, {
          title: chunk.maps.title,
          url: chunk.maps.uri,
        });
      }
    }
  }
}

function collectTrace(
  trace: GeoGenerateTrace,
  queries: string[],
  seenQueries: Set<string>,
  sources: GeoCheckSource[],
  seenUrls: Set<string>
): void {
  for (const source of trace.sources ?? []) {
    addSource(sources, seenUrls, source);
  }
  collectToolInputs(trace.toolCalls, queries, seenQueries);
  collectToolOutputs(
    trace.toolResults,
    queries,
    seenQueries,
    sources,
    seenUrls
  );
  collectProviderMetadata(
    trace.providerMetadata,
    queries,
    seenQueries,
    sources,
    seenUrls
  );
}

export function extractGrounding(result: GeoGenerateTrace): GeoCheckGrounding {
  const queries: string[] = [];
  const sources: GeoCheckSource[] = [];
  const seenQueries = new Set<string>();
  const seenUrls = new Set<string>();

  collectTrace(result, queries, seenQueries, sources, seenUrls);

  for (const step of result.steps ?? []) {
    if (!isRecord(step)) {
      continue;
    }
    collectTrace(
      {
        sources: Array.isArray(step.sources) ? step.sources : undefined,
        toolCalls: Array.isArray(step.toolCalls) ? step.toolCalls : undefined,
        toolResults: Array.isArray(step.toolResults)
          ? step.toolResults
          : undefined,
        providerMetadata: step.providerMetadata,
      },
      queries,
      seenQueries,
      sources,
      seenUrls
    );
  }

  if (sources.length === 0 && typeof result.text === "string") {
    for (const source of perplexitySourcesFromExcerpt(result.text)) {
      addSource(sources, seenUrls, source);
    }
  }

  if (queries.length === 0 && sources.length === 0) {
    return EMPTY_GEO_CHECK_GROUNDING;
  }

  return {
    queries: queries.slice(0, GEO_CHECK_GROUNDING_MAX_QUERIES),
    sources: sources.slice(0, GEO_CHECK_GROUNDING_MAX_SOURCES),
  };
}
