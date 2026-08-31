import type {
  GeoCompetitor,
  GeoGapWriteAction,
  GeoPromptGapRow,
  GeoSearchGapRow,
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
