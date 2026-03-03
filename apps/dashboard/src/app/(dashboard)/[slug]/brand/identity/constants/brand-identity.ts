import { SUPPORTED_LANGUAGES } from "@/constants/languages";
import type { ToneProfile } from "@/schemas/brand";

export const AUTO_SAVE_DELAY = 1500;

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

export const FULL_URL_REGEX = /^https?:\/\//i;
