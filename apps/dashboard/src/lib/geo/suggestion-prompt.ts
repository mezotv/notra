import type { GscQueryRow } from "@notra/ai/types/google-search-console";

import {
  GEO_GAP_TITLE_MAX_LENGTH,
  GEO_PROMPT_MAX_LENGTH,
  GEO_PROMPT_MIN_LENGTH,
} from "@/constants/geo";
import {
  GSC_MAX_KEYWORDS_PER_SUGGESTION,
  GSC_SUGGESTIONS_MAX_PER_SYNC,
  GSC_SYNC_LOOKBACK_DAYS,
} from "@/constants/google-search-console";
import type { GscSuggestionGenerationParams } from "@/types/google-search-console";

export const GSC_SUGGESTION_SYSTEM_PROMPT =
  "You are a search visibility analyst and content strategist. You turn the Google Search queries a website already ranks for into the questions people ask AI assistants about the same topics, plus the article headline that would win each question. Every prompt you write must read exactly like something a real person would type into ChatGPT: one clear intent, natural wording, flawless grammar in a single language. Never string keywords together. Respond only with the requested structured data.";

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
- A prompt is the exact text a real person would type into an AI assistant (ChatGPT, Claude, Gemini, Perplexity) about these topics. Write it as one natural, grammatically correct question or search phrase with a single clear intent - for example "What tools should I use for content writing", "Best Hootsuite alternative for small teams ${year}", or "How to see who viewed your LinkedIn profile".
- Do not copy keyword phrasing verbatim; rewrite the underlying intent in your own words. Never concatenate keywords, never mix languages within a prompt, and never write anything you would not plausibly type yourself. Read each prompt aloud before keeping it; if it sounds off, rewrite it.
- Group related queries into one prompt; do not write one prompt per keyword.
- Never mention "${brand}" or any brand name owned by ${brand} in the prompt. Frame each question around the topic, problem, or buying decision so the answer reveals whether an assistant recommends ${brand} unprompted. Competitor brand names are allowed only in alternatives or comparison prompts ("Best Buffer alternatives ${year}").
- Prefer topics with high impressions and commercial or comparison intent. Append "${year}" only where a real person would (best-of, alternatives, pricing) - not on definitions or how-tos.
- Each prompt must be between ${GEO_PROMPT_MIN_LENGTH} and ${GEO_PROMPT_MAX_LENGTH} characters, in the same language as the underlying queries.

Title rules:
- The title is the headline of the article that would win this prompt: specific, publishable and in Title Case, following proven formats such as "Best {Category} Tools in ${year}: {Facets} Compared", "Best {Competitor} Alternatives for {Use Case} in ${year}", "{A} vs {B}: Features, Pricing & Which to Choose in ${year}", "{Product} Pricing: Plans & Cost Breakdown for ${year}", "How to {Task} (Step-by-Step ${year})", or "What Is {Term}? Definition, Examples & How to Measure It".
- Write titles in the same language as the prompt and keep each under ${GEO_GAP_TITLE_MAX_LENGTH} characters.

Keyword rules:
- For each entry, list up to ${GSC_MAX_KEYWORDS_PER_SUGGESTION} exact source queries (copied verbatim from the list above) it was derived from.`;
}
