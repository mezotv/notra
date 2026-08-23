import type { AILogTarget } from "@notra/ai/observability";
import type {
  geoBriefInternalLinkSchema,
  geoBriefSectionSchema,
  geoContentBriefSchema,
  geoContentSubtypeSchema,
} from "@notra/ai/schemas/geo-writer";
import type { AgentTokenUsage } from "@notra/ai/types/agents";
import type { TccMetadata } from "@notra/ai/types/tcc";
import type { PostSourceMetadata } from "@notra/db/schema";
import type { z } from "zod";

export type GeoContentSubtype = z.infer<typeof geoContentSubtypeSchema>;
export type GeoBriefSection = z.infer<typeof geoBriefSectionSchema>;
export type GeoBriefInternalLink = z.infer<typeof geoBriefInternalLinkSchema>;
export type GeoContentBrief = z.infer<typeof geoContentBriefSchema>;

export interface GeoPlannerBrand {
  companyName: string;
  aliases: string[];
  websiteUrl?: string | null;
  description?: string | null;
  audience?: string | null;
}

export interface GeoPlannerCompetitor {
  name: string;
  domain?: string | null;
}

export interface GeoPlannerGapPrompt {
  prompt: string;
  engines: string[];
}

export interface GeoPlannerSitemapPage {
  url: string;
  title?: string | null;
}

export interface GeoPlannerPromptInput {
  topic: string;
  brand: GeoPlannerBrand;
  competitors: GeoPlannerCompetitor[];
  gapPrompts: GeoPlannerGapPrompt[];
  sitemapPages: GeoPlannerSitemapPage[];
  contentSubtype?: GeoContentSubtype;
}

export interface GenerateGeoContentBriefOptions {
  organizationId: string;
  input: GeoPlannerPromptInput;
  log?: AILogTarget;
}

export interface GenerateGeoContentBriefResult {
  brief: GeoContentBrief;
  usage: AgentTokenUsage;
}

export interface GeoWriterPromptInput {
  brief: GeoContentBrief;
  brandName: string;
  topic: string;
  today: string;
  monthYear: string;
  language: string;
}

export interface RunGeoWriterOptions {
  organizationId: string;
  projectId: string;
  brandSettingsId: string;
  collectionId: string;
  brief: GeoContentBrief;
  topic: string;
  brandName: string;
  language?: string | null;
  sourceMetadata?: PostSourceMetadata;
  log?: AILogTarget;
  telemetryMetadata?: TccMetadata;
  postId?: string | null;
}

export interface GeoWriterResult {
  postId: string;
  title: string;
  humanized: boolean;
  usage: AgentTokenUsage;
}

export interface SitemapToolsConfig {
  brandSettingsId: string;
}

export interface GeoContextToolConfig {
  organizationId: string;
  projectId: string;
}
