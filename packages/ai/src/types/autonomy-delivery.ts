import type {
  IrisApproval,
  IrisApprovalAction,
} from "../schemas/autonomy/outbox";

export interface IrisOutboxRow {
  id: string;
  organizationId: string;
  destination: string;
  attempts: number;
  payload: unknown;
}

export type IrisDeliveryStatus = "delivered" | "pending" | "failed" | "skipped";

export interface IrisDeliveryOutcome {
  outboxId: string;
  status: IrisDeliveryStatus;
  lastError: string | null;
  nextAttemptAt: Date | null;
}

export interface IrisDeliverySummary {
  processed: number;
  delivered: number;
  retrying: number;
  failed: number;
  skipped: number;
}

export interface RecordIrisApprovalInput {
  organizationId: string;
  outboxId: string;
  postId: string;
  action: IrisApprovalAction;
  slackUserId: string;
  slackUserName: string | null;
}

export interface RecordIrisApprovalResult {
  recorded: boolean;
  existingAction: IrisApprovalAction | null;
  approvals: readonly IrisApproval[];
}

export interface ShipIrisPostInput {
  organizationId: string;
  postId: string;
}

export type ShipIrisPostStatus = "shipped" | "already_published" | "not_found";

export interface ShipIrisPostResult {
  status: ShipIrisPostStatus;
  postId: string;
  title: string | null;
}
