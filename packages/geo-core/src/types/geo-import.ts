import type { GeoCompetitor, GeoCompetitorKind } from "./geo";

export type GeoImportKind = "prompts" | "competitors";

export interface GeoPromptImportRow {
  prompt: string;
  enabled?: boolean;
}

export interface GeoCompetitorImportRow {
  name: string;
  domain?: string | null;
  kind?: GeoCompetitorKind;
  synonyms?: string[];
}

export interface GeoCsvIssue {
  line: number;
  message: string;
}

export interface GeoCsvParseResult<TRow> {
  rows: TRow[];
  issues: GeoCsvIssue[];
  duplicates: number;
  total: number;
}

export interface GeoImportResult {
  imported: number;
  updated: number;
  skipped: number;
}

export interface GeoCompetitorsImportResult extends GeoImportResult {
  competitors: GeoCompetitor[];
}

export interface GeoImportKindCopy {
  title: string;
  description: string;
  noun: string;
  nounPlural: string;
  columns: string;
  templateFilename: string;
  template: string;
}

export interface GeoCsvSelection<TRow> {
  file: File;
  result: GeoCsvParseResult<TRow>;
}
