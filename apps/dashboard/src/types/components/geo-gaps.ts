import type {
  GeoCompetitor,
  GeoPromptGapRow,
  GeoSearchGapRow,
} from "@/types/geo";

export type GeoGapsTab = "prompt" | "search";

export type GeoGapsMeterTone = "empty" | "low" | "mid" | "high";

export type GeoGapsEmptyKind =
  | "scanning"
  | "no-scan"
  | "no-prompt-gaps"
  | "no-search-gaps";

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

export interface GeoGapsPageContentProps {
  organizationSlug: string;
}
