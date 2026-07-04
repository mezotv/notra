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

export const updateTitleFilterBodySchema = titleFilterIdSchema
  .extend({
    enabled: z.boolean().optional(),
    matchType: z.enum(TITLE_FILTER_MATCH_TYPES).optional(),
    pattern: titleFilterPatternSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.enabled === undefined && value.pattern === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "At least one field must be provided",
        path: ["enabled"],
      });
    }

    if (value.pattern !== undefined && value.matchType === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "Match type is required when updating the pattern",
        path: ["matchType"],
      });
    }

    if (
      value.matchType === "regex" &&
      value.pattern !== undefined &&
      !isValidTitleFilterRegex(value.pattern)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid regular expression",
        path: ["pattern"],
      });
    }
  });
export type UpdateTitleFilterBody = z.infer<typeof updateTitleFilterBodySchema>;
