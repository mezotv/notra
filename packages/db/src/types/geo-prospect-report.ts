import type { GEO_PROSPECT_REPORT_STATUSES } from "../constants/geo-prospect-reports";

export type GeoProspectReportStatus =
  (typeof GEO_PROSPECT_REPORT_STATUSES)[number];

export type GeoProspectPromptIntent =
  | "best-of"
  | "comparison"
  | "alternatives"
  | "how-to"
  | "pricing"
  | "branded";

export type GeoProspectSentiment =
  | "positive"
  | "neutral"
  | "mixed"
  | "negative";

export type GeoProspectClaimStatus =
  | "accurate"
  | "outdated"
  | "missing"
  | "wrong";

export type GeoProspectChannel =
  | "docs"
  | "comparison-page"
  | "listicle"
  | "reddit"
  | "github"
  | "youtube"
  | "changelog";

export interface GeoProspectPromptAnswerJson {
  text: string;
  sources: { url: string; title: string }[];
}

export interface GeoProspectTrackedPromptJson {
  id: string;
  text: string;
  intent: GeoProspectPromptIntent;
  /** Position of the company in each model's answer, keyed by model id. `null` = not mentioned. */
  ranks: Record<string, number | null>;
  /** Raw answers from the scan, keyed by model id. */
  answers?: Record<string, GeoProspectPromptAnswerJson>;
}

export interface GeoProspectCompetitorJson {
  id: string;
  name: string;
  domain: string;
  shareOfVoice: number;
  mentionRate: number;
  winsOn: string;
}

export interface GeoProspectClaimJson {
  id: string;
  text: string;
  status: GeoProspectClaimStatus;
}

export interface GeoProspectModelPerceptionJson {
  modelId: string;
  sentiment: GeoProspectSentiment;
  mentionRate: number;
  quote: string;
  claims: GeoProspectClaimJson[];
}

export interface GeoProspectShelfSpaceOpportunityJson {
  id: string;
  prompt: string;
  occupiedBy: string[];
  gap: string;
  action: string;
  channel: GeoProspectChannel;
}

export interface GeoProspectCitedSourceJson {
  id: string;
  domain: string;
  name: string;
  share: number;
  brandPresent: boolean;
}

/**
 * Stored shape of a prospect-facing GEO report built in the console.
 * Mirrors `GeoReport` in `apps/console` (`src/types/geo-report.ts`) and
 * `geoReportSchema` there; the console owns the editor and the renderer.
 */
export interface GeoProspectReportJson {
  id: string;
  status: GeoProspectReportStatus;
  company: { name: string; domain: string; category: string };
  preparedAt: string;
  preparedBy: string;
  summary: {
    visibilityScore: number;
    shareOfVoice: number;
    shareOfVoiceRank: number;
    sentimentScore: number;
    citations: number;
  };
  modelIds: string[];
  prompts: GeoProspectTrackedPromptJson[];
  competitors: GeoProspectCompetitorJson[];
  perceptions: GeoProspectModelPerceptionJson[];
  opportunities: GeoProspectShelfSpaceOpportunityJson[];
  sources: GeoProspectCitedSourceJson[];
}
