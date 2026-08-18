import { gateway } from "@notra/ai/gateway";
import {
  GscReauthRequiredError,
  getGscIntegration,
  queryGscTopQueries,
  updateGscIntegration,
} from "@notra/ai/integrations/google-search-console";
import type {
  GscIntegrationRow,
  GscQueryRow,
} from "@notra/ai/types/google-search-console";
import { db } from "@notra/db/drizzle";
import {
  geoPromptSuggestions,
  geoPrompts,
  geoSettings,
} from "@notra/db/schema";
import { generateText, Output } from "ai";
import { eq } from "drizzle-orm";
import { GEO_PROMPT_MAX_LENGTH, GEO_PROMPT_MIN_LENGTH } from "@/constants/geo";
import {
  GSC_MIN_BRAND_TERM_LENGTH,
  GSC_POSITION_DECIMALS,
  GSC_SUGGESTION_MAX_TOKENS,
  GSC_SUGGESTION_MODEL,
  GSC_SUGGESTION_SYSTEM_PROMPT,
  GSC_SUGGESTIONS_MAX_PER_SYNC,
  GSC_SYNC_LOOKBACK_DAYS,
  GSC_SYNC_MAX_KEYWORDS_FOR_MODEL,
  GSC_SYNC_MIN_IMPRESSIONS,
  GSC_SYNC_ROW_LIMIT,
} from "@/constants/google-search-console";
import { geoSearchConsoleSuggestionSchema } from "@/schemas/google-search-console";
import type { GeoSuggestionKeyword } from "@/types/geo";
import type {
  GscBrandSettings,
  GscSuggestionGenerationParams,
  GscSyncResult,
} from "@/types/google-search-console";

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function isBrandedQuery(query: string, brandTerms: string[]): boolean {
  const normalized = ` ${normalizeKey(query)} `;
  // Match on word boundaries so a short alias like "hub" does not drop "github".
  return brandTerms.some((term) => normalized.includes(` ${term} `));
}

function buildBrandTerms(settings: GscBrandSettings | null): string[] {
  if (!settings) {
    return [];
  }
  return [settings.companyName, ...settings.aliases]
    .map(normalizeKey)
    .filter((term) => term.length >= GSC_MIN_BRAND_TERM_LENGTH);
}

function selectKeywordsForModel(
  rows: GscQueryRow[],
  brandTerms: string[]
): GscQueryRow[] {
  return rows
    .filter(
      (row) =>
        row.impressions >= GSC_SYNC_MIN_IMPRESSIONS &&
        !isBrandedQuery(row.query, brandTerms)
    )
    .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks)
    .slice(0, GSC_SYNC_MAX_KEYWORDS_FOR_MODEL);
}

function buildSuggestionPrompt(params: GscSuggestionGenerationParams): string {
  const keywordLines = params.keywords
    .map(
      (row) =>
        `- "${row.query}" (impressions ${row.impressions}, clicks ${row.clicks}, avg position ${row.position.toFixed(GSC_POSITION_DECIMALS)})`
    )
    .join("\n");
  const existing =
    params.existingPrompts.length > 0
      ? params.existingPrompts.map((prompt) => `- ${prompt}`).join("\n")
      : "- (none)";
  const brand = params.companyName ?? "this company";

  return `Company: ${brand}
Search Console property: ${params.siteUrl}

These are Google Search queries the website already ranks for (last ${GSC_SYNC_LOOKBACK_DAYS} days):
${keywordLines}

Prompts already tracked (do not repeat or paraphrase these):
${existing}

Write up to ${GSC_SUGGESTIONS_MAX_PER_SYNC} questions a real person would type into an AI assistant (ChatGPT, Claude, Gemini, Perplexity) about the same topics. Rules:
- Group related queries into one prompt; do not write one prompt per keyword.
- Never mention "${brand}" or any brand name in the prompt. Frame each question around the topic, problem, or buying decision so the answer reveals whether an assistant recommends ${brand} unprompted.
- Prefer topics with high impressions and commercial or comparison intent.
- Each prompt must be a natural full-sentence question between ${GEO_PROMPT_MIN_LENGTH} and ${GEO_PROMPT_MAX_LENGTH} characters, in the same language as the underlying queries.
- For each prompt, list the exact source queries (copied verbatim from the list above) it was derived from.`;
}

async function generateSuggestions(params: GscSuggestionGenerationParams) {
  const result = await generateText({
    model: gateway(GSC_SUGGESTION_MODEL),
    output: Output.object({ schema: geoSearchConsoleSuggestionSchema }),
    system: GSC_SUGGESTION_SYSTEM_PROMPT,
    prompt: buildSuggestionPrompt(params),
    maxOutputTokens: GSC_SUGGESTION_MAX_TOKENS,
  });
  return result.output.prompts;
}

export async function syncGscSuggestions(
  organizationId: string
): Promise<GscSyncResult> {
  const integration = await getGscIntegration(organizationId);
  if (!integration?.enabled) {
    return { status: "skipped", reason: "not_connected" };
  }
  if (!integration.siteUrl) {
    return { status: "skipped", reason: "no_site_selected" };
  }
  if (integration.status === "reauth_required") {
    return { status: "skipped", reason: "reauth_required" };
  }

  try {
    const result = await runSync(integration, integration.siteUrl);
    await updateGscIntegration(organizationId, {
      lastSyncedAt: new Date(),
      lastError: null,
    });
    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Search Console sync failed";
    if (!(error instanceof GscReauthRequiredError)) {
      await updateGscIntegration(organizationId, { lastError: message });
    }
    throw error;
  }
}

async function runSync(
  integration: GscIntegrationRow,
  siteUrl: string
): Promise<GscSyncResult> {
  const organizationId = integration.organizationId;

  const [rows, settingsRow, trackedRows, suggestionRows] = await Promise.all([
    queryGscTopQueries(integration, {
      siteUrl,
      days: GSC_SYNC_LOOKBACK_DAYS,
      rowLimit: GSC_SYNC_ROW_LIMIT,
    }),
    db.query.geoSettings.findFirst({
      where: eq(geoSettings.organizationId, organizationId),
      columns: { companyName: true, aliases: true },
    }),
    db.query.geoPrompts.findMany({
      where: eq(geoPrompts.organizationId, organizationId),
      columns: { prompt: true },
    }),
    db.query.geoPromptSuggestions.findMany({
      where: eq(geoPromptSuggestions.organizationId, organizationId),
      columns: { prompt: true },
    }),
  ]);

  const brandTerms = buildBrandTerms(settingsRow ?? null);
  const keywords = selectKeywordsForModel(rows, brandTerms);
  if (keywords.length === 0) {
    return { status: "completed", keywords: rows.length, suggestionsAdded: 0 };
  }

  const existingPrompts = [
    ...trackedRows.map((row) => row.prompt),
    ...suggestionRows.map((row) => row.prompt),
  ];
  const seen = new Set(existingPrompts.map(normalizeKey));
  const keywordByQuery = new Map(
    keywords.map((row) => [normalizeKey(row.query), row] as const)
  );

  const generated = await generateSuggestions({
    companyName: settingsRow?.companyName ?? null,
    siteUrl,
    keywords,
    existingPrompts,
  });

  const values: (typeof geoPromptSuggestions.$inferInsert)[] = [];
  for (const item of generated) {
    const prompt = item.prompt.trim();
    const key = normalizeKey(prompt);
    if (
      prompt.length < GEO_PROMPT_MIN_LENGTH ||
      prompt.length > GEO_PROMPT_MAX_LENGTH ||
      seen.has(key)
    ) {
      continue;
    }
    const sourceKeywords: GeoSuggestionKeyword[] = [];
    const usedKeywordKeys = new Set<string>();
    for (const keyword of item.keywords) {
      const keywordKey = normalizeKey(keyword);
      const match = keywordByQuery.get(keywordKey);
      if (match && !usedKeywordKeys.has(keywordKey)) {
        usedKeywordKeys.add(keywordKey);
        sourceKeywords.push({
          query: match.query,
          clicks: match.clicks,
          impressions: match.impressions,
          position: Number(match.position.toFixed(GSC_POSITION_DECIMALS)),
        });
      }
    }
    if (sourceKeywords.length === 0) {
      continue;
    }
    seen.add(key);
    values.push({
      id: crypto.randomUUID(),
      organizationId,
      prompt,
      source: "search_console",
      sourceKeywords,
      status: "pending",
    });
  }

  if (values.length > 0) {
    await db
      .insert(geoPromptSuggestions)
      .values(values)
      .onConflictDoNothing({
        target: [
          geoPromptSuggestions.organizationId,
          geoPromptSuggestions.prompt,
        ],
      });
  }

  return {
    status: "completed",
    keywords: rows.length,
    suggestionsAdded: values.length,
  };
}
