import type {
  GEO_CONTENT_BRIEF_STATUSES,
  GEO_WRITER_SOURCE_KINDS,
} from "../constants/geo-writer";

export type GeoContentBriefContentType =
  | "guide"
  | "comparison"
  | "listicle"
  | "how-to"
  | "faq"
  | "alternatives";

export interface GeoContentBriefSectionJson {
  heading: string;
  goal: string;
  claims: string[];
}

export interface GeoContentBriefInternalLinkJson {
  url: string;
  anchor: string;
  why: string;
}

/**
 * Stored shape of a GEO writer brief. Mirrors `geoContentBriefSchema` in
 * `@notra/ai/schemas/geo-writer`; kept here so the schema package does not
 * depend on the AI package.
 */
export interface GeoContentBriefJson {
  targetPrompt: string;
  intent: string;
  contentType: GeoContentBriefContentType;
  workingTitle: string;
  audience: string;
  jobToBeDone: string;
  sections: GeoContentBriefSectionJson[];
  questionsToAnswer: string[];
  internalLinks: GeoContentBriefInternalLinkJson[];
  acceptanceChecklist: string[];
}

export type GeoContentBriefStatus = (typeof GEO_CONTENT_BRIEF_STATUSES)[number];

export type GeoWriterSourceKind = (typeof GEO_WRITER_SOURCE_KINDS)[number];
