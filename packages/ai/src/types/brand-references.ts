export type AgentType = "twitter" | "linkedin" | "blog" | "changelog";

export interface BrandReferencesConfig {
  organizationId: string;
  voiceId?: string;
  agentType?: AgentType;
}

export interface BrandReferenceSummary {
  id: string;
  brandIdentityId: string;
  type: string;
  content: string;
  note: string | null;
  sourceCapturedAt: string | null;
  sourceContentHash: string | null;
  sourceSnapshotKey: string | null;
  sourceUrl: string | null;
  applicableTo: string[];
  createdAt: string;
  updatedAt: string;
}
