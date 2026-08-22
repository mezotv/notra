import { GEO_MAX_PROMPTS } from "@/constants/geo";
import type {
  GeoBrandContext,
  GeoPromptDefinition,
  GeoSettings,
  GeoTrackedPrompt,
} from "@/types/geo";

const CUSTOM_PROMPT_SCAN_ID_PREFIX = "custom-";
const SEQUENCE_PROMPT_SCAN_ID_PREFIX = "sequence-";

/**
 * Scan results are recorded under a namespaced prompt id for custom prompts
 * (`custom-<uuid>`) so they never collide with the slug ids of auto prompts.
 */
export function customPromptScanId(promptId: string): string {
  return `${CUSTOM_PROMPT_SCAN_ID_PREFIX}${promptId}`;
}

/** The prompt id under which a tracked prompt's scan results are stored. */
export function trackedPromptScanId(
  prompt: Pick<GeoTrackedPrompt, "id" | "source">
): string {
  return prompt.source === "custom" ? customPromptScanId(prompt.id) : prompt.id;
}

export function isCustomPromptScanId(promptId: string): boolean {
  return promptId.startsWith(CUSTOM_PROMPT_SCAN_ID_PREFIX);
}

export function isConversationScanPromptId(promptId: string): boolean {
  return promptId.startsWith(SEQUENCE_PROMPT_SCAN_ID_PREFIX);
}

export function promptIdFromScanId(scanId: string): string {
  return scanId.startsWith(CUSTOM_PROMPT_SCAN_ID_PREFIX)
    ? scanId.slice(CUSTOM_PROMPT_SCAN_ID_PREFIX.length)
    : scanId;
}

/**
 * Mention checks for custom prompts are keyed by `custom-<uuid>`. Fall back to
 * the raw id so auto-generated slugs (`best-tools`) and legacy rows still match.
 */
export function findPromptMentionEntry<T>(
  byPrompt: Map<string, T>,
  promptId: string
): T | undefined {
  return byPrompt.get(customPromptScanId(promptId)) ?? byPrompt.get(promptId);
}

const SENTENCE_SPLIT_REGEX = /[.!?]/;
const LEADING_FILLER_REGEX =
  /^(we are|we're|we|it is|it's|the|a|an|our)\s+(the\s+|a\s+|an\s+)?/i;
const PLATFORM_PREFIX_REGEX =
  /^(platform|tool|software|solution|service|app|product)\s+(for|to|that)\s+/i;
const WHITESPACE_REGEX = /\s+/;
const TRAILING_PUNCTUATION_REGEX = /[\s,;:.-]+$/;

const CATEGORY_MAX_WORDS = 12;
const CATEGORY_FALLBACK = "software in this space";
const AUDIENCE_MAX_WORDS = 14;

function condense(value: string, maxWords: number): string {
  return value
    .trim()
    .split(WHITESPACE_REGEX)
    .slice(0, maxWords)
    .join(" ")
    .replace(TRAILING_PUNCTUATION_REGEX, "");
}

function deriveCategory(companyDescription: string | null): string {
  if (!companyDescription) {
    return CATEGORY_FALLBACK;
  }
  const firstSentence = companyDescription.split(SENTENCE_SPLIT_REGEX).at(0);
  if (!firstSentence) {
    return CATEGORY_FALLBACK;
  }
  const cleaned = firstSentence
    .trim()
    .replace(LEADING_FILLER_REGEX, "")
    .replace(PLATFORM_PREFIX_REGEX, "");
  const condensed = condense(cleaned, CATEGORY_MAX_WORDS).toLowerCase();
  return condensed.length > 0 ? condensed : CATEGORY_FALLBACK;
}

function deriveAudience(audience: string | null): string | null {
  if (!audience) {
    return null;
  }
  const condensed = condense(audience, AUDIENCE_MAX_WORDS).toLowerCase();
  return condensed.length > 0 ? condensed : null;
}

export function buildGeoPrompts(
  settings: GeoSettings,
  brand: GeoBrandContext | null
): GeoPromptDefinition[] {
  const companyName = settings.companyName;
  const category = deriveCategory(brand?.companyDescription ?? null);
  const audience = deriveAudience(brand?.audience ?? null);

  const prompts: GeoPromptDefinition[] = [
    { id: "best-tools", text: `What are the best tools for ${category}?` },
    {
      id: "alternatives",
      text: `What are good alternatives to ${companyName}?`,
    },
    {
      id: "recommendation",
      text: `Which product would you recommend for ${category}, and why?`,
    },
    {
      id: "comparison",
      text: `How does ${companyName} compare to other options for ${category}?`,
    },
    { id: "what-is", text: `What is ${companyName} and who is it for?` },
    {
      id: "how-to-choose",
      text: `How should I choose a product for ${category}?`,
    },
    {
      id: "top-list",
      text: `Can you list the top 5 companies for ${category} right now?`,
    },
  ];

  if (audience) {
    prompts.push({
      id: "audience-specific",
      text: `Which tools for ${category} work best for ${audience}?`,
    });
  }

  return prompts.slice(0, GEO_MAX_PROMPTS);
}
