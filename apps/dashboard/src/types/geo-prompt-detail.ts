import type {
  GeoCompetitor,
  GeoPromptHistoryCheck,
  GeoPromptResultSummary,
  GeoPromptReceiptView,
  GeoPromptResult,
} from "@notra/geo-core/types/geo";

export type GeoPromptDetailState =
  | { status: "ready"; result: GeoPromptResult }
  | { status: "loading" | "error" | "missing" };

export interface GeoPromptDetailStatusProps {
  status: "loading" | "error" | "missing";
  onRetry: () => void;
}

export interface PromptAnswerBodyProps {
  detailState: GeoPromptDetailState;
  view: GeoPromptReceiptView;
  prompt: string;
  scanPromptId: string;
  /** Scan whose captured answer replaces the latest one, when picked. */
  selectedCheck: GeoPromptHistoryCheck | null;
  history: GeoPromptHistoryCheck[];
  isHistoryLoading: boolean;
  competitors?: readonly GeoCompetitor[];
  onRetry: () => void;
  onSelectCheck: (check: GeoPromptHistoryCheck) => void;
  onBackToLatest: () => void;
}

export interface PromptAnswerHeaderProps {
  prompt: string;
  results: readonly GeoPromptResultSummary[];
  active: GeoPromptResultSummary | null;
  view: GeoPromptReceiptView;
  onSelectEngine: (engine: string, direction: number) => void;
  onSelectView: (view: GeoPromptReceiptView) => void;
}
