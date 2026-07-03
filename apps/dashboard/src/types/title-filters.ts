import type { TitleFilterMatchType } from "@/schemas/title-filters";

export interface TitleFilter {
  id: string;
  matchType: TitleFilterMatchType;
  pattern: string;
  enabled: boolean;
  createdAt: string;
}

export interface TitleFiltersResponse {
  filters: TitleFilter[];
}

export interface TitleFilterPreset {
  id: string;
  label: string;
  description: string;
  matchType: TitleFilterMatchType;
  pattern: string;
}

export type TitleFilterSource = "github" | "linear";

export interface TitleFiltersSectionProps {
  source: TitleFilterSource;
  organizationId: string;
  targetId: string;
}
