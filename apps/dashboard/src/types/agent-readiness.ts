import type { IconSvgElement } from "@hugeicons/react";
import type { geoAgentReadinessReports } from "@notra/db/schema";
import type {
  AgentReadinessIssue,
  AgentReadinessReportStatus,
  AgentReadinessScoreBreakdown,
} from "@notra/db/types/agent-readiness";
import type { infer as ZodInfer } from "zod";

import type { agentReadinessApiReportSchema } from "@/schemas/agent-readiness";

export type AgentReadinessApiReport = ZodInfer<
  typeof agentReadinessApiReportSchema
>;

export type AgentReadinessReportRow =
  typeof geoAgentReadinessReports.$inferSelect;

export interface AgentReadinessParsedReport {
  score: number | null;
  scoreLabel: string | null;
  scoreBreakdown: AgentReadinessScoreBreakdown | null;
  issues: AgentReadinessIssue[];
  eligibleChecks: number | null;
  reportUrl: string | null;
  scannedAt: Date | null;
}

export interface AgentReadinessScope {
  organizationId: string;
  projectId: string;
  brandSettingsId: string;
}

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

export interface AgentReadinessPageProps {
  params: Promise<{ slug: string }>;
}

export interface AgentReadinessBodyProps {
  data: AgentReadinessResponse;
  isScanPending: boolean;
  onRequestScan: () => void;
}

export interface AgentReadinessCopyPromptButtonProps {
  prompt: string;
  label: string;
  variant?: "outline" | "default" | "ghost";
  size?: "sm" | "xs";
}

export interface AgentReadinessResultBadgeProps {
  result: AgentReadinessIssue["result"];
}

export interface AgentReadinessChecklistPromptActionsProps {
  targetUrl: string;
  groups: AgentReadinessIssueGroups;
}

export interface AgentReadinessIssueEntryProps {
  issue: AgentReadinessIssue;
  index: number;
  targetUrl: string;
}

export interface AgentReadinessSectionHeaderProps {
  icon: IconSvgElement;
  iconClassName: string;
  label: string;
  hint: string;
  count: number;
}

export interface AgentReadinessScanningBreakdownTileProps {
  label: string;
  hint: string;
}

export interface AgentReadinessScoreDeltaProps {
  score: number;
  previousScore: number | null;
}

export interface AgentReadinessBreakdownTileProps {
  label: string;
  value: string;
  hint: string;
  passing?: number;
  total?: number;
}

export interface AgentReadinessScoreGaugeProps {
  score: number;
  className?: string;
}

export interface AgentReadinessSseEvent {
  type?: string;
}

export interface AgentReadinessSseFrameBoundary {
  index: number;
  length: number;
}

export interface AgentReadinessRunningScan {
  createdAt: Date;
  targetUrl: string;
}
