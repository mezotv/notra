import { array, object, string } from "zod";
import { GEO_PROMPT_MAX_LENGTH, GEO_PROMPT_MIN_LENGTH } from "@/constants/geo";
import { GSC_SUGGESTIONS_MAX_PER_SYNC } from "@/constants/google-search-console";

const MAX_CALLBACK_PATH_LENGTH = 512;
const MAX_KEYWORDS_PER_SUGGESTION = 8;

export const gscAuthorizeQuerySchema = object({
  organizationId: string().min(1, "Organization ID is required"),
  callbackPath: string()
    .min(1)
    .max(MAX_CALLBACK_PATH_LENGTH)
    .refine((path) => path.startsWith("/") && !path.startsWith("//"), {
      message: "callbackPath must be a same-origin path",
    })
    .default("/"),
});

export const gscSelectSiteInputSchema = object({
  organizationId: string().min(1),
  siteUrl: string().min(1),
});

export const gscSyncPayloadSchema = object({
  organizationId: string().min(1),
});

export const geoSearchConsoleSuggestionSchema = object({
  prompts: array(
    object({
      prompt: string().min(GEO_PROMPT_MIN_LENGTH).max(GEO_PROMPT_MAX_LENGTH),
      keywords: array(string().min(1)).min(1).max(MAX_KEYWORDS_PER_SUGGESTION),
    })
  ).max(GSC_SUGGESTIONS_MAX_PER_SYNC),
});
