import type {
  GeoCompetitor,
  GeoGapWriteAction,
  GeoPromptGapRow,
  GeoSearchGapRow,
  GeoSuggestionKeyword,
  GeoWriterSourceKind,
} from "@notra/geo-core/types/geo";

export interface GeoGapsWriteCellProps {
  action: GeoGapWriteAction;
  postId: string | null | undefined;
  sourceKind: GeoWriterSourceKind;
  opportunityBucket: number | null;
  onOpenPost: (postId: string) => void;
  onWrite: () => void;
}

export type GeoGapsTab = "prompt" | "search";

export type GeoGapsMeterTone = "empty" | "low" | "mid" | "high";

export type GeoGapsEmptyKind =
  | "scanning"
  | "no-scan"
  | "no-prompt-gaps"
  | "no-search-gaps"
  | "no-matches";

export interface GeoGapsTableProps {
  promptGaps: GeoPromptGapRow[];
  searchGaps: GeoSearchGapRow[];
  competitors: GeoCompetitor[];
  hasScanData: boolean;
  isScanning: boolean;
  organizationSlug: string;
  onRunScan: () => void;
  onWritePrompt: (row: GeoPromptGapRow) => void;
  onWriteSearch: (row: GeoSearchGapRow) => void;
  onOpenPost: (postId: string) => void;
}

export interface GeoGapsEmptyProps {
  kind: GeoGapsEmptyKind;
  isScanning: boolean;
  organizationSlug: string;
  onRunScan: () => void;
}

export interface GeoGapsTabsProps {
  tab: GeoGapsTab;
  onTabChange: (tab: GeoGapsTab) => void;
  promptCount: number;
  searchCount: number;
}

export interface GeoGapsFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  engine: string;
  onEngineChange: (value: string) => void;
  engineFamilies: readonly string[];
}

export interface GeoGapsPageContentProps {
  organizationSlug: string;
}

export interface GeoGapOpportunityCellProps {
  row: GeoPromptGapRow;
  maxOpportunity: number;
}

export interface GeoGapVisibleOnCellProps {
  mentionedEngines: readonly string[];
  missingEngines: readonly string[];
}

export interface GeoGapBrandMentionsCellProps {
  competitors: GeoCompetitor[];
  tracked: readonly string[];
  discovered: readonly string[];
}

export interface GeoGapContentCellProps {
  title: string;
  subtitle: string | null;
}

export interface GeoGapWriteCellProps {
  action: GeoGapWriteAction;
  postId: string | null | undefined;
  onOpenPost: (postId: string) => void;
  onWrite: () => void;
}

export interface GeoGapQueriesCellProps {
  prompt: string;
  queries: readonly GeoSuggestionKeyword[];
}

export interface GeoGapNumberCellProps {
  value: number | null;
  emptyLabel: string;
  format?: (value: number) => string;
}

export interface GeoGapMeterProps {
  level: number;
  label: string;
}
