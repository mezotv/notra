export type GeoDirectionKey =
  | "instrument"
  | "leaderboard"
  | "cockpit"
  | "report";

export interface GeoDirectionTab {
  key: GeoDirectionKey;
  label: string;
}

export type GeoDirectionTone = "up" | "flat" | "down";

export interface GeoDirectionEngineRow {
  engine: string;
  label: string;
  rate: number;
  delta: number;
  checks: number;
  avgPosition: number | null;
}

export interface GeoDirectionTrendRow {
  day: string;
  grounded: number;
  training: number;
  [key: string]: string | number;
}

export interface GeoDirectionPromptPosition {
  engine: string;
  position: number | null;
}

export interface GeoDirectionPrompt {
  promptId: string;
  prompt: string;
  positions: GeoDirectionPromptPosition[];
}

export interface GeoDirectionPromptEngine {
  engine: string;
  label: string;
}

export type GeoDirectionSourceKind = "crawl" | "referral";

export interface GeoDirectionSourceRow {
  source: string;
  label: string;
  kind: GeoDirectionSourceKind;
  visits: number;
  share: number;
}

export interface GeoDirectionKpi {
  label: string;
  value: number;
  hint: string;
}

export interface DirectionDeltaProps {
  delta: number;
  className?: string;
}

export interface DirectionDonutProps {
  className?: string;
  legendClassName?: string;
}

export interface PromptResultsTableProps {
  className?: string;
}

export interface DirectionBlockProps {
  className?: string;
}

export interface DirectionSectionHeadingProps {
  children: string;
}

export interface DirectionPositionCellProps {
  position: number | null;
}

export interface DirectionBarProps {
  value: number;
  max: number;
  className?: string;
}
