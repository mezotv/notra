import type { GscQueryRow } from "@notra/ai/types/google-search-console";
import { GEO_PROMPT_MAX_LENGTH, GEO_PROMPT_MIN_LENGTH } from "@/constants/geo";
import {
  GSC_MAX_KEYWORDS_PER_SUGGESTION,
  GSC_SUGGESTIONS_MAX_PER_SYNC,
  GSC_SYNC_LOOKBACK_DAYS,
} from "@/constants/google-search-console";
import type { GscSuggestionGenerationParams } from "@/types/google-search-console";

export const GSC_SUGGESTION_SYSTEM_PROMPT =
  "You are a search visibility analyst. You turn the Google Search queries a website already ranks for into the natural-language questions people ask AI assistants about the same topics. Respond only with the requested structured data.";

function formatKeywordLine(row: GscQueryRow): string {
  return `- "${row.query}" (impressions ${row.impressions}, clicks ${row.clicks}, avg position ${row.position.toFixed(1)})`;
}

function formatExistingPrompts(prompts: string[]): string {
  if (prompts.length === 0) {
    return "- (none)";
  }
  return prompts.map((prompt) => `- ${prompt}`).join("\n");
}

export function buildGscSuggestionPrompt(
  params: GscSuggestionGenerationParams
): string {
  const brand = params.companyName ?? "this company";
  const keywordLines = params.keywords.map(formatKeywordLine).join("\n");

  return `Company: ${brand}
Search Console property: ${params.siteUrl}

These are Google Search queries the website already ranks for (last ${GSC_SYNC_LOOKBACK_DAYS} days):
${keywordLines}

Prompts already used (do not repeat or paraphrase these):
${formatExistingPrompts(params.existingPrompts)}

Write up to ${GSC_SUGGESTIONS_MAX_PER_SYNC} questions a real person would type into an AI assistant (ChatGPT, Claude, Gemini, Perplexity) about the same topics. Rules:
- Group related queries into one prompt; do not write one prompt per keyword.
- Never mention "${brand}" or any brand name in the prompt. Frame each question around the topic, problem, or buying decision so the answer reveals whether an assistant recommends ${brand} unprompted.
- Prefer topics with high impressions and commercial or comparison intent.
- Each prompt must be a natural full-sentence question between ${GEO_PROMPT_MIN_LENGTH} and ${GEO_PROMPT_MAX_LENGTH} characters, in the same language as the underlying queries.
- For each prompt, list up to ${GSC_MAX_KEYWORDS_PER_SUGGESTION} exact source queries (copied verbatim from the list above) it was derived from.`;
}
