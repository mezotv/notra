import { SUPPORTED_LANGUAGES } from "@notra/ai/constants/languages";
import type { ToneProfile } from "@notra/ai/schemas/tone";

export const AUTO_SAVE_DELAY = 2500;

export const ANALYSIS_STEPS = [
  { value: "scraping", label: "Scraping" },
  { value: "extracting", label: "Extracting" },
  { value: "saving", label: "Saving" },
];

export const TONE_OPTIONS: { value: ToneProfile; label: string }[] = [
  { value: "Conversational", label: "Conversational" },
  { value: "Professional", label: "Professional" },
  { value: "Casual", label: "Casual" },
  { value: "Formal", label: "Formal" },
];

export const LANGUAGE_OPTIONS = SUPPORTED_LANGUAGES;

export const LANGUAGE_FLAGS: Record<
  (typeof SUPPORTED_LANGUAGES)[number],
  string
> = {
  English: "🇺🇸",
  Spanish: "🇪🇸",
  French: "🇫🇷",
  German: "🇩🇪",
  Portuguese: "🇵🇹",
  Dutch: "🇳🇱",
  Italian: "🇮🇹",
  Japanese: "🇯🇵",
  Korean: "🇰🇷",
  Chinese: "🇨🇳",
  Arabic: "🇸🇦",
  Hindi: "🇮🇳",
  Russian: "🇷🇺",
  Turkish: "🇹🇷",
  Polish: "🇵🇱",
  Swedish: "🇸🇪",
  Danish: "🇩🇰",
  Norwegian: "🇳🇴",
  Finnish: "🇫🇮",
  Czech: "🇨🇿",
  Romanian: "🇷🇴",
  Hungarian: "🇭🇺",
  Greek: "🇬🇷",
  Thai: "🇹🇭",
  Vietnamese: "🇻🇳",
  Indonesian: "🇮🇩",
  Ukrainian: "🇺🇦",
  Hebrew: "🇮🇱",
};

export const getLanguageFlag = (language: string) =>
  LANGUAGE_FLAGS[language as keyof typeof LANGUAGE_FLAGS] ?? "🏳️";

export const FULL_URL_REGEX = /^https?:\/\//i;

export const IDENTITY_NAME_MAX_LENGTH = 13;
