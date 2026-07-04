// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const TITLE_FILTER_MATCH_TYPES = ["contains", "regex"] as const;
export type TitleFilterMatchType = (typeof TITLE_FILTER_MATCH_TYPES)[number];

export const MAX_TITLE_FILTER_PATTERN_LENGTH = 256;

export function isValidTitleFilterRegex(pattern: string) {
  try {
    new RegExp(pattern, "i");
    return true;
  } catch {
    return false;
  }
}

export const titleFilterPatternSchema = z
  .string()
  .trim()
  .min(1, "Pattern is required")
  .max(MAX_TITLE_FILTER_PATTERN_LENGTH, "Pattern is too long");

export const createTitleFilterBodySchema = z
  .object({
    matchType: z.enum(TITLE_FILTER_MATCH_TYPES),
    pattern: titleFilterPatternSchema,
  })
  .refine(
    (value) =>
      value.matchType !== "regex" || isValidTitleFilterRegex(value.pattern),
    {
      message: "Enter a valid regular expression",
      path: ["pattern"],
    }
  );
export type CreateTitleFilterBody = z.infer<typeof createTitleFilterBodySchema>;

export const titleFilterIdSchema = z.object({
  filterId: z.string().min(1, "Filter ID is required"),
});

export const updateTitleFilterBodySchema = titleFilterIdSchema.extend({
  enabled: z.boolean(),
});
export type UpdateTitleFilterBody = z.infer<typeof updateTitleFilterBodySchema>;
