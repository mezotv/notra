import type { agentFeedback } from "@notra/db/schema";
import type { IngestTokenIdentity } from "@notra/utils/types/ingest-token";

export type AgentFeedbackRow = typeof agentFeedback.$inferSelect;

export type SerializedAgentFeedback = Omit<
  AgentFeedbackRow,
  "createdAt" | "updatedAt" | "resolvedAt"
> & {
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export type FeedbackTokenVerification =
  | { success: true; identity: IngestTokenIdentity }
  | { success: false; error: string; status: 401 | 403 | 503 };
