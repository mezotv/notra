export interface AgentReadinessTierBreakdown {
  earned: number;
  available: number;
  passing: number;
  total: number;
}

export interface AgentReadinessBonusBreakdown {
  points: number;
  positiveSignals: number;
}

export interface AgentReadinessScoreBreakdown {
  essential: AgentReadinessTierBreakdown;
  recommended: AgentReadinessTierBreakdown;
  bonus: AgentReadinessBonusBreakdown;
}

export type AgentReadinessIssueTier = "essential" | "recommended" | "bonus";

export type AgentReadinessIssueResult = "failed" | "partial";

export interface AgentReadinessIssue {
  id: string;
  name: string;
  tier: AgentReadinessIssueTier;
  result: AgentReadinessIssueResult;
  details: string | null;
  recommendation: string | null;
}

export type AgentReadinessReportStatus = "running" | "completed" | "failed";
