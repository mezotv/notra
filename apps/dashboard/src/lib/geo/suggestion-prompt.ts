import type { GscQueryRow } from "@notra/ai/types/google-search-console";

import {
  GEO_GAP_TITLE_MAX_LENGTH,
  GEO_PROMPT_MAX_LENGTH,
  GEO_PROMPT_MIN_LENGTH,
  GEO_TRACKED_PROMPT_VOICE,
} from "@/constants/geo";
import {
  GSC_MAX_KEYWORDS_PER_SUGGESTION,
  GSC_SUGGESTIONS_MAX_PER_SYNC,
  GSC_SYNC_LOOKBACK_DAYS,
} from "@/constants/google-search-console";
import type { GscSuggestionGenerationParams } from "@/types/google-search-console";

export const GSC_SUGGESTION_SYSTEM_PROMPT = `You are a search visibility analyst. You turn the Google Search queries a website already ranks for into the questions people type into ChatGPT about the same topics, plus the article headline that would win each question. ${GEO_TRACKED_PROMPT_VOICE} Never mention the tracked company or product by name. Never copy a product description or tagline. Stay in one language. Respond only with the requested structured data.`;

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
  const year = new Date().getFullYear();

  return `Company: ${brand}
Search Console property: ${params.siteUrl}

These are Google Search queries the website already ranks for (last ${GSC_SYNC_LOOKBACK_DAYS} days):
${keywordLines}

Prompts already used (do not repeat or paraphrase these):
${formatExistingPrompts(params.existingPrompts)}

Write up to ${GSC_SUGGESTIONS_MAX_PER_SYNC} entries. Each entry has a "prompt", a "title", and "keywords".

Prompt rules:
- A prompt is the exact text a real person would type into ChatGPT about these topics. ${GEO_TRACKED_PROMPT_VOICE}
- Do not copy keyword phrasing verbatim; rewrite the underlying intent in your own words. Never concatenate keywords, never mix languages within a prompt, and never write anything you would not plausibly type yourself.
- Group related queries into one prompt; do not write one prompt per keyword.
- Never mention "${brand}" or any brand name owned by ${brand} in the prompt. Never copy what ${brand} is or does into the question. Frame each question around the topic, problem, or buying decision so the answer reveals whether an assistant recommends ${brand} unprompted. Competitor brand names are allowed only in alternatives or comparison prompts, still in the same lowercase voice ("what's a good buffer alternative").
- Prefer topics with high impressions and commercial or comparison intent. Do not append "${year}".
- Each prompt must be between ${GEO_PROMPT_MIN_LENGTH} and ${GEO_PROMPT_MAX_LENGTH} characters, in the same language as the underlying queries.

Title rules:
- The title is the headline of the article that would win this prompt: specific, publishable and in Title Case, following proven formats such as "Best {Category} Tools in ${year}: {Facets} Compared", "Best {Competitor} Alternatives for {Use Case} in ${year}", "{A} vs {B}: Features, Pricing & Which to Choose in ${year}", "{Product} Pricing: Plans & Cost Breakdown for ${year}", "How to {Task} (Step-by-Step ${year})", or "What Is {Term}? Definition, Examples & How to Measure It".
- Write titles in the same language as the prompt and keep each under ${GEO_GAP_TITLE_MAX_LENGTH} characters.

Keyword rules:
- For each entry, list up to ${GSC_MAX_KEYWORDS_PER_SUGGESTION} exact source queries (copied verbatim from the list above) it was derived from.`;
}
