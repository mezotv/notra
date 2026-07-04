import type { FormEvent } from "react";
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
  targetLabel?: string;
}

export interface TitleFilterAddFormProps {
  matchType: TitleFilterMatchType;
  pattern: string;
  patternError: string | null;
  isPending: boolean;
  onMatchTypeChange: (value: TitleFilterMatchType | null) => void;
  onPatternChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export interface TitleFilterPresetListProps {
  presets: TitleFilterPreset[];
  disabled: boolean;
  onAdd: (preset: TitleFilterPreset) => void;
}

export interface TitleFilterRowProps {
  filter: TitleFilter;
  presetLabel?: string;
  updatePending: boolean;
  deletePending: boolean;
  onToggle: (enabled: boolean) => void;
  onPatternSave: (pattern: string) => void;
  onDelete: () => void;
}
