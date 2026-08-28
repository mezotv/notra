import type {
  AgentReadinessIssue,
  AgentReadinessReportStatus,
  AgentReadinessScoreBreakdown,
} from "@notra/db/types/agent-readiness";

export interface AgentReadinessReportView {
  id: string;
  status: AgentReadinessReportStatus;
  targetUrl: string;
  score: number | null;
  scoreLabel: string | null;
  scoreBreakdown: AgentReadinessScoreBreakdown | null;
  issues: AgentReadinessIssue[];
  eligibleChecks: number | null;
  reportUrl: string | null;
  errorMessage: string | null;
  scannedAt: string | null;
  createdAt: string;
}

/** One completed scan, compressed for the trend chart. */
export interface AgentReadinessHistoryPoint {
  id: string;
  score: number | null;
  failedCount: number;
  partialCount: number;
  scannedAt: string;
}

export interface AgentReadinessResponse {
  targetUrl: string;
  /** Latest completed report, if any. */
  report: AgentReadinessReportView | null;
  /** Latest run newer than the completed report (running or failed). */
  scan: AgentReadinessReportView | null;
  /** Completed scans, oldest first, for trend detection. */
  history: AgentReadinessHistoryPoint[];
}

export interface AgentReadinessScanResponse {
  reportId: string;
  alreadyRunning: boolean;
}

export interface AgentReadinessWorkflowPayload {
  organizationId: string;
  projectId: string;
  reportId: string;
  targetUrl: string;
}

export type AgentReadinessWorkflowResult =
  | { status: "completed" }
  | { status: "failed"; reason: string }
  | { status: "invalid_payload" };

export interface AgentReadinessScoreCardProps {
  report: AgentReadinessReportView;
  /** Score of the previous completed scan, for the trend delta. */
  previousScore: number | null;
  isScanning: boolean;
  onRescan: () => void;
}

export type AgentReadinessScoreBandKey = "great" | "needs-improvement" | "poor";

export interface AgentReadinessScoreBand {
  key: AgentReadinessScoreBandKey;
  label: string;
}

export interface AgentReadinessScanningNoticeProps {
  targetUrl: string;
}

export interface AgentReadinessIssueGroups {
  mustDo: AgentReadinessIssue[];
  shouldDo: AgentReadinessIssue[];
}

export interface AgentReadinessChecklistProps {
  targetUrl: string;
  issues: AgentReadinessIssue[];
}

export interface AgentReadinessScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}
