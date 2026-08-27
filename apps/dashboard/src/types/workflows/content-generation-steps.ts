import type { AgentTokenUsage } from "@notra/ai/types/agents";
import type {
  ContentCreationMode,
  DatabuddyWorkflowSource,
} from "@notra/content-generation/databuddy";
import type { PostSourceMetadata } from "@notra/db/schema";

import type { AiCreditReservation } from "@/types/billing/ai-credit-lock";
import type {
  IntegrationType,
  LogRetentionDays,
} from "@/types/webhooks/webhooks";
import type {
  ContentEmailDigestKind,
  EnqueueContentEmailDigestEvent,
} from "@/types/workflows/content-email-digest";

export interface WorkflowAiCreditGate extends AiCreditReservation {
  reason?: "no_active_paid_plan" | "insufficient_ai_credits";
  shouldNotify?: boolean;
  balanceRemaining?: number | null;
}

export interface FinishGenerationInput {
  organizationId: string;
  runId: string;
  triggerId: string;
  outputType: string;
  triggerName: string;
  status: "success" | "failed" | "skipped";
  reason?: string;
  title?: string;
}

export interface FinalizeAiCreditInput {
  lockId: string | null;
  action: "confirm" | "release";
  usage?: AgentTokenUsage;
  fallbackModelId?: string;
  useMarkup?: boolean;
  properties?: Record<string, string | number | boolean>;
  logPrefix: string;
}

export interface AppendAutomationLogInput {
  organizationId: string;
  integrationId: string;
  integrationType: IntegrationType;
  retentionDays?: LogRetentionDays;
  title: string;
  status: "success" | "failed" | "skipped";
  errorMessage?: string;
  referenceId?: string;
}

export interface TrackContentOutcomeInput {
  kind: "created" | "failed" | "skipped";
  triggerId: string;
  organizationId: string;
  outputType: string;
  creationMode: ContentCreationMode;
  lookbackWindow: string;
  repositoryCount: number;
  source: DatabuddyWorkflowSource;
  postIds?: string[];
  reason?: string;
  logPrefix: string;
}

export type NotificationSettingKey =
  | "scheduledContentCreation"
  | "scheduledContentFailed"
  | "scheduledContentSkipped";

export interface NotificationData {
  enabled: boolean;
  ownerEmails: string[];
  organizationName: string;
  organizationSlug: string;
}

export interface EnqueueDigestInput {
  organizationId: string;
  recipientEmails: string[];
  kind: ContentEmailDigestKind;
  event: EnqueueContentEmailDigestEvent;
  logPrefix: string;
}

export interface CreateGenerationCollectionInput {
  collectionId: string;
  organizationId: string;
  source: "schedule" | "automation" | "manual" | "api";
  sourceId: string;
  outputType: string;
  sourceMetadata: PostSourceMetadata & Record<string, unknown>;
}

export interface WorkflowPauseInput {
  triggerId: string;
  organizationId: string;
  automationName: string;
  reason: "ai_credits_depleted" | "workflow_errors";
  logPrefix: string;
}
