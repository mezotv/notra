import {
  GEO_BRIEF_MAX_CHECKLIST,
  GEO_BRIEF_MAX_CLAIMS,
  GEO_BRIEF_MAX_LINKS,
  GEO_BRIEF_MAX_QUESTIONS,
  GEO_BRIEF_MAX_SECTIONS,
  GEO_BRIEF_MAX_TITLE_LENGTH,
  GEO_BRIEF_MIN_SECTIONS,
} from "@notra/ai/constants/geo-writer";
import { BLOG_POST_SUBTYPES } from "@notra/db/constants/content";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const geoContentSubtypeSchema = z.enum(BLOG_POST_SUBTYPES);

export const geoBriefSectionSchema = z.object({
  heading: z.string().min(1).describe("H2 heading for this section"),
  goal: z
    .string()
    .min(1)
    .describe("One sentence on what the reader should take away"),
  claims: z
    .array(z.string().min(1))
    .max(GEO_BRIEF_MAX_CLAIMS)
    .describe("Concrete, checkable claims this section must make"),
});

export const geoBriefInternalLinkSchema = z.object({
  url: z.string().min(1),
  anchor: z.string().min(1).describe("Anchor text to use for the link"),
  why: z.string().min(1).describe("Why this page belongs in the article"),
});

export const geoContentBriefSchema = z.object({
  targetPrompt: z
    .string()
    .min(1)
    .describe("The question a buyer would ask an AI assistant"),
  intent: z.string().min(1).describe("Search intent behind the target prompt"),
  contentSubtype: geoContentSubtypeSchema.describe(
    "The kind of blog post to write"
  ),
  workingTitle: z.string().min(1).max(GEO_BRIEF_MAX_TITLE_LENGTH),
  audience: z.string().min(1),
  jobToBeDone: z.string().min(1),
  sections: z
    .array(geoBriefSectionSchema)
    .min(GEO_BRIEF_MIN_SECTIONS)
    .max(GEO_BRIEF_MAX_SECTIONS),
  questionsToAnswer: z
    .array(z.string().min(1))
    .max(GEO_BRIEF_MAX_QUESTIONS)
    .describe("Questions the FAQ section must answer directly"),
  internalLinks: z.array(geoBriefInternalLinkSchema).max(GEO_BRIEF_MAX_LINKS),
  acceptanceChecklist: z.array(z.string().min(1)).max(GEO_BRIEF_MAX_CHECKLIST),
});
