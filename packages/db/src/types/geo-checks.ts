export interface GeoCheckScope {
  organizationId: string;
  projectId: string | null;
}

export interface GeoCheckSourceItem {
  url: string;
  title: string | null;
}

export interface GeoCheckWrite {
  id?: string;
  organizationId: string;
  projectId: string;
  scanId: string;
  engine: string;
  promptId: string;
  sequenceId?: string | null;
  turn?: number;
  prompt: string;
  answer: string;
  mentioned: boolean;
  position: number | null;
  sentiment: string | null;
  competitors: string[];
  excerpt: string;
  language: string;
  sources?: GeoCheckSourceItem[];
  capturedAt: Date;
}

export interface GeoCheckOverviewRow {
  engine: string;
  checks: number;
  mentions: number;
  mentionRate: number;
  avgPosition: number | null;
  lastCheckedAt: Date;
}

export interface GeoCheckTimeseriesRow {
  day: string;
  engine: string;
  checks: number;
  mentions: number;
}

export interface GeoCheckPromptResultRow {
  promptId: string;
  engine: string;
  prompt: string;
  answer: string;
  mentioned: boolean;
  position: number | null;
  sentiment: string | null;
  excerpt: string;
  lastCheckedAt: Date;
}

export interface GeoCheckCompetitorShareRow {
  brand: string;
  mentions: number;
}

export interface GeoCheckCompetitorShareTimeseriesRow {
  brand: string;
  day: string;
  mentions: number;
}

export interface GeoCheckCompetitorTimeseriesRow {
  day: string;
  mentions: number;
  checks: number;
}

export interface GeoCheckCompetitorPromptRow {
  promptId: string;
  engine: string;
  prompt: string;
  mentioned: boolean;
  position: number | null;
  capturedAt: Date;
}

export interface GeoCheckLanguageShareRow {
  language: string;
  checks: number;
  mentions: number;
  mentionRate: number;
  avgPosition: number | null;
  lastCheckedAt: Date;
}

export interface GeoCheckWindow {
  from?: Date;
  toExclusive?: Date;
}

export interface GeoCheckWindowInput {
  days?: number;
  from?: string;
  to?: string;
}

export interface GeoCheckSequenceResultRow {
  sequenceId: string;
  turn: number;
  engine: string;
  prompt: string;
  answer: string;
  mentioned: boolean;
  position: number | null;
  sentiment: string | null;
  excerpt: string;
  sources: GeoCheckSourceItem[];
  lastCheckedAt: Date;
}
