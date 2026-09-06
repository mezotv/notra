import { describe, expect, test } from "bun:test";

import {
  GEO_AI_OVERVIEW_INVALID_ENVELOPE,
  GEO_AI_OVERVIEW_INVALID_OVERVIEW,
  GEO_AI_OVERVIEW_INVALID_SHAPE,
  GEO_SERPAPI_JSON_RESTRICTOR,
  GEO_SERPAPI_LIVE_ENV,
  geoAiOverviewLocale,
} from "../src/constants/geo-ai-overview";
import {
  GEO_MODEL_CATALOG_SEED,
  GEO_MODEL_PROVIDERS,
} from "../src/constants/geo-model-catalog";
import type { GeoModelCatalog } from "../src/types/geo";
import type { GeoAiOverviewParse } from "../src/types/geo-ai-overview";
import {
  parseGoogleAiOverview,
  serpApiErrorMessage,
} from "../src/utils/geo-ai-overview";
import { resolveEngineIconKey } from "../src/utils/geo-engine-icon";
import { resolveGroundedEngines } from "../src/utils/geo-grounded-engines";
import { geoModelsForProvider } from "../src/utils/geo-model-catalog";
import { isGroundedEngine } from "../src/utils/geo-presence";

const AI_OVERVIEW_ENGINE_ID = "google/ai-overview";

function successEnvelope(
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  return { search_metadata: { status: "Success" }, ...extra };
}

const catalog: GeoModelCatalog = {
  providers: [...GEO_MODEL_PROVIDERS],
  models: [
    ...GEO_MODEL_CATALOG_SEED,
    {
      id: AI_OVERVIEW_ENGINE_ID,
      provider: "google",
      label: "AI Overview",
      zdr: "none",
      released: "2026-09-05",
      default: false,
      gateways: ["serpapi"],
    },
  ],
};

describe("parseGoogleAiOverview", () => {
  test("flattens text blocks and citations, ignoring organic results", () => {
    const parsed = parseGoogleAiOverview(
      successEnvelope({
        organic_results: [
          {
            title: "Should not be tracked",
            link: "https://example.com/organic",
          },
        ],
        ai_overview: {
          text_blocks: [
            {
              type: "paragraph",
              snippet: "Notra tracks AI search visibility.",
            },
            { type: "heading", snippet: "Why it matters" },
            {
              type: "list",
              list: [
                { snippet: "Mentions across engines" },
                { title: "Citations", snippet: "from AI Overviews" },
              ],
            },
            {
              type: "expandable",
              title: "Sources",
              text_blocks: [
                { type: "paragraph", snippet: "Cited pages only." },
              ],
            },
          ],
          references: [
            {
              title: "Notra",
              link: "https://usenotra.com",
              source: "usenotra.com",
            },
            {
              title: "Duplicate",
              link: "https://usenotra.com",
            },
            {
              title: "Ignored",
              link: "ftp://example.com",
            },
          ],
        },
      })
    );

    expect(parsed).toEqual({
      status: "present",
      text: [
        "Notra tracks AI search visibility.",
        "Why it matters",
        "Mentions across engines",
        "Citations",
        "from AI Overviews",
        "Sources",
        "Cited pages only.",
      ].join("\n"),
      sources: [
        {
          title: "Notra",
          url: "https://usenotra.com",
          domain: "usenotra.com",
        },
      ],
    });
  });

  test("treats a successful search without an overview as absent", () => {
    const parsed = parseGoogleAiOverview(
      successEnvelope({
        organic_results: [
          { title: "Wikipedia", link: "https://en.wikipedia.org" },
        ],
      })
    );
    expect(parsed).toEqual({ status: "absent", pageToken: null });
  });

  test("treats a recognized empty overview module as absent", () => {
    expect(
      parseGoogleAiOverview(
        successEnvelope({ ai_overview: { text_blocks: [] } })
      )
    ).toEqual({ status: "absent", pageToken: null });
  });

  test("keeps the page token only when the overview body is still missing", () => {
    const pending = parseGoogleAiOverview(
      successEnvelope({
        ai_overview: { page_token: "token-1" },
      })
    );
    expect(pending).toEqual({ status: "absent", pageToken: "token-1" });

    const ready = parseGoogleAiOverview(
      successEnvelope({
        ai_overview: {
          page_token: "token-1",
          text_blocks: [{ snippet: "Ready." }],
        },
      })
    );
    expect(ready).toEqual({
      status: "present",
      text: "Ready.",
      sources: [],
    });
  });

  test("rejects malformed envelopes instead of counting them as misses", () => {
    expect(parseGoogleAiOverview("not-json")).toEqual({
      status: "invalid",
      reason: GEO_AI_OVERVIEW_INVALID_ENVELOPE,
    });
    expect(
      parseGoogleAiOverview({ ai_overview: { snippet: "Ready." } })
    ).toEqual({
      status: "invalid",
      reason: GEO_AI_OVERVIEW_INVALID_ENVELOPE,
    });
    expect(
      parseGoogleAiOverview(
        successEnvelope({ ai_overview: "not an overview object" })
      )
    ).toEqual({
      status: "invalid",
      reason: GEO_AI_OVERVIEW_INVALID_OVERVIEW,
    });
    expect(
      parseGoogleAiOverview(successEnvelope({ ai_overview: { unknown: true } }))
    ).toEqual({
      status: "invalid",
      reason: GEO_AI_OVERVIEW_INVALID_SHAPE,
    });
  });

  test("reads serpapi error envelopes", () => {
    expect(serpApiErrorMessage({ error: "Invalid API key." })).toBe(
      "Invalid API key."
    );
    expect(serpApiErrorMessage({ ai_overview: {} })).toBe(null);
  });
});

describe("google AI Overview catalog wiring", () => {
  test("counts as a search engine and uses the Google icon, not Gemini", () => {
    expect(isGroundedEngine(AI_OVERVIEW_ENGINE_ID)).toBe(true);
    expect(isGroundedEngine("google/gemini-3.5-flash")).toBe(false);
    expect(resolveEngineIconKey(AI_OVERVIEW_ENGINE_ID)).toBe("google");
    expect(resolveEngineIconKey("google/gemini-3.5-flash")).toBe("gemini");
  });

  test("does not spawn a grounded twin through the LLM web-search path", () => {
    expect(resolveGroundedEngines([AI_OVERVIEW_ENGINE_ID], catalog)).toEqual(
      []
    );
  });

  test("pins the overview above Gemini models in the Google picker", () => {
    const googleModels = geoModelsForProvider(catalog, "google");
    expect(googleModels[0]?.id).toBe(AI_OVERVIEW_ENGINE_ID);
  });

  test("maps GEO language names onto SerpApi hl/gl", () => {
    expect(geoAiOverviewLocale("German")).toEqual({ hl: "de", gl: "de" });
    expect(geoAiOverviewLocale("not-a-language")).toEqual({
      hl: "en",
      gl: "us",
    });
  });
});

const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY?.trim() ?? "";
const SERPAPI_LIVE =
  process.env[GEO_SERPAPI_LIVE_ENV] === "1" && SERPAPI_API_KEY.length > 0;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPresent(
  parsed: GeoAiOverviewParse
): parsed is Extract<GeoAiOverviewParse, { status: "present" }> {
  return parsed.status === "present";
}

async function serpApiJson(
  params: Record<string, string>
): Promise<{ status: number; payload: unknown }> {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("api_key", SERPAPI_API_KEY);
  url.searchParams.set("json_restrictor", GEO_SERPAPI_JSON_RESTRICTOR);
  url.searchParams.set("device", "desktop");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const response = await fetch(url, {
    headers: { accept: "application/json" },
  });
  return { status: response.status, payload: await response.json() };
}

/** Same sequence the scan engine uses: google search, then page_token follow-up. */
async function fetchOverviewLikeProduction(
  query: string,
  locale: { hl: string; gl: string }
) {
  const first = await serpApiJson({
    engine: "google",
    q: query,
    hl: locale.hl,
    gl: locale.gl,
  });
  expect(first.status).toBe(200);
  expect(serpApiErrorMessage(first.payload)).toBe(null);
  expect(
    isRecord(first.payload) ? first.payload.organic_results : undefined
  ).toBe(undefined);

  let parsed = parseGoogleAiOverview(first.payload);
  expect(parsed.status).not.toBe("invalid");
  let usedPageToken = false;
  if (parsed.status === "absent" && parsed.pageToken) {
    usedPageToken = true;
    const second = await serpApiJson({
      engine: "google_ai_overview",
      page_token: parsed.pageToken,
    });
    expect(second.status).toBe(200);
    expect(serpApiErrorMessage(second.payload)).toBe(null);
    parsed = parseGoogleAiOverview(second.payload);
    expect(parsed.status).not.toBe("invalid");
  }
  return { parsed, usedPageToken };
}

describe.skipIf(!SERPAPI_LIVE)("SerpApi Google AI Overview live", () => {
  test("rejects an invalid API key", async () => {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google");
    url.searchParams.set("q", "test");
    url.searchParams.set("api_key", "invalid-key");
    url.searchParams.set("json_restrictor", GEO_SERPAPI_JSON_RESTRICTOR);
    const response = await fetch(url);
    const payload: unknown = await response.json();
    expect(response.ok && serpApiErrorMessage(payload) === null).toBe(false);
  }, 30_000);

  test("returns AI Overview text and citations for a common query", async () => {
    const { parsed, usedPageToken } = await fetchOverviewLikeProduction(
      "what is photosynthesis",
      { hl: "en", gl: "us" }
    );
    expect(isPresent(parsed)).toBe(true);
    if (!isPresent(parsed)) {
      return;
    }
    expect(parsed.text.length).toBeGreaterThan(40);
    expect(parsed.sources.length).toBeGreaterThan(0);
    for (const source of parsed.sources) {
      expect(source.url.startsWith("https://")).toBe(true);
      expect(source.domain.includes(".")).toBe(true);
    }
    expect(typeof usedPageToken).toBe("boolean");
  }, 60_000);

  test("follows a GEO-style prompt and a German locale without failing", async () => {
    const english = await fetchOverviewLikeProduction(
      "best tools for ai content generation",
      { hl: "en", gl: "us" }
    );
    const german = await fetchOverviewLikeProduction(
      "was ist fotosynthese",
      geoAiOverviewLocale("German")
    );
    expect(english.parsed.status).not.toBe("invalid");
    expect(german.parsed.status).not.toBe("invalid");
    expect(isPresent(english.parsed) || isPresent(german.parsed)).toBe(true);
    if (isPresent(english.parsed)) {
      expect(english.parsed.text.length).toBeGreaterThan(0);
    }
    if (isPresent(german.parsed)) {
      expect(german.parsed.text.length).toBeGreaterThan(0);
    }
  }, 90_000);
});
