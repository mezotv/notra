// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "../constants/languages";

export const supportedLanguageSchema = z.enum(SUPPORTED_LANGUAGES);

export function getValidLanguage(value: unknown): SupportedLanguage {
  const parsed = supportedLanguageSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_LANGUAGE;
}
