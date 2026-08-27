import { gateway } from "@notra/ai/gateway";
import {
  GscApiError,
  GscReauthRequiredError,
  getGscIntegration,
  queryGscTopQueries,
  updateGscIntegration,
} from "@notra/ai/integrations/google-search-console";
import type { GscIntegrationRow } from "@notra/ai/types/google-search-console";
import { db } from "@notra/db/drizzle";
import {
  geoPromptSuggestions,
  geoPrompts,
  geoSettings,
} from "@notra/db/schema";
import { generateText, Output } from "ai";
import { and, eq, ne } from "drizzle-orm";

import {
  GEO_GAP_TITLE_MAX_LENGTH,
  GEO_PROMPT_MAX_LENGTH,
  GEO_PROMPT_MIN_LENGTH,
} from "@/constants/geo";
import {
  GSC_SUGGESTION_MAX_TOKENS,
  GSC_SUGGESTION_MODEL,
  GSC_SYNC_LOOKBACK_DAYS,
  GSC_SYNC_ROW_LIMIT,
} from "@/constants/google-search-console";
import {
  buildBrandTerms,
  normalizeSuggestionKey,
  promptMentionsBrand,
  resolveSourceKeywords,
  selectKeywordsForModel,
} from "@/lib/geo/suggestion-keywords";
import {
  buildGscSuggestionPrompt,
  GSC_SUGGESTION_SYSTEM_PROMPT,
} from "@/lib/geo/suggestion-prompt";
import { geoSearchConsoleSuggestionSchema } from "@/schemas/google-search-console";
import type {
  GscSuggestionGenerationParams,
  GscSyncResult,
} from "@/types/google-search-console";

async function generateSuggestions(params: GscSuggestionGenerationParams) {
  const result = await generateText({
    model: gateway(GSC_SUGGESTION_MODEL),
    output: Output.object({ schema: geoSearchConsoleSuggestionSchema }),
    system: GSC_SUGGESTION_SYSTEM_PROMPT,
    prompt: buildGscSuggestionPrompt(params),
    maxOutputTokens: GSC_SUGGESTION_MAX_TOKENS,
  });
  return result.output.prompts;
}

/**
 * `lastError` is rendered in the dashboard, so only curated copy goes in —
 * raw provider/SDK messages stay in the logs.
 */
function toStoredSyncError(error: unknown): string {
  if (error instanceof GscApiError) {
    return error.status === 403
      ? "Google denied access to this property. Reconnect or pick another one."
      : "Search Console could not be reached. We will retry with the next sync.";
  }
  return "We could not turn your Search Console keywords into prompt suggestions.";
}

export async function syncGscSuggestions(
  organizationId: string
): Promise<GscSyncResult> {
  const integration = await getGscIntegration(organizationId);
  if (!integration) {
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
    console.error("[GSC] Sync failed:", error);
    if (!(error instanceof GscReauthRequiredError)) {
      await updateGscIntegration(organizationId, {
        lastError: toStoredSyncError(error),
      });
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
    // Accepted/dismissed rows occupy the (organizationId, prompt) unique index
    // even after the tracked prompt is deleted. Pending rows are replaced later.
    db.query.geoPromptSuggestions.findMany({
      where: and(
        eq(geoPromptSuggestions.organizationId, organizationId),
        ne(geoPromptSuggestions.status, "pending")
      ),
      columns: { prompt: true },
    }),
  ]);

  const brandTerms = buildBrandTerms(settingsRow);
  const keywords = selectKeywordsForModel(rows, brandTerms);
  if (keywords.length === 0) {
    return { status: "completed", keywords: rows.length, suggestionsAdded: 0 };
  }

  const existingPrompts = [
    ...trackedRows.map((row) => row.prompt),
    ...suggestionRows.map((row) => row.prompt),
  ];
  const seen = new Set(existingPrompts.map(normalizeSuggestionKey));
  const keywordByQuery = new Map(
    keywords.map((row) => [normalizeSuggestionKey(row.query), row] as const)
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
    const key = normalizeSuggestionKey(prompt);
    if (
      prompt.length < GEO_PROMPT_MIN_LENGTH ||
      prompt.length > GEO_PROMPT_MAX_LENGTH ||
      seen.has(key) ||
      promptMentionsBrand(prompt, brandTerms)
    ) {
      continue;
    }
    const sourceKeywords = resolveSourceKeywords(item.keywords, keywordByQuery);
    if (sourceKeywords.length === 0) {
      continue;
    }
    const title = item.title.trim().slice(0, GEO_GAP_TITLE_MAX_LENGTH);
    seen.add(key);
    values.push({
      id: crypto.randomUUID(),
      organizationId,
      prompt,
      title: title.length > 0 ? title : null,
      source: "search_console",
      sourceKeywords,
      status: "pending",
    });
  }

  let inserted: { id: string }[] = [];
  if (values.length > 0) {
    await db.transaction(async (tx) => {
      await tx
        .delete(geoPromptSuggestions)
        .where(
          and(
            eq(geoPromptSuggestions.organizationId, organizationId),
            eq(geoPromptSuggestions.status, "pending")
          )
        );
      inserted = await tx
        .insert(geoPromptSuggestions)
        .values(values)
        .onConflictDoNothing()
        .returning({ id: geoPromptSuggestions.id });
    });
  }

  return {
    status: "completed",
    keywords: rows.length,
    suggestionsAdded: inserted.length,
  };
}
