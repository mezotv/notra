import type { NextRequest } from "next/server";
import type { GitHubEventType } from "@/schemas/github-webhook";
import type { InputIntegrationType } from "@/schemas/integrations";

export interface WebhookContext {
  provider: InputIntegrationType;
  organizationId: string;
  integrationId: string;
  repositoryId: string;
  request: NextRequest;
  rawBody: string;
}

export interface WebhookResult {
  success: boolean;
  message?: string;
  data?: unknown;
}

export type WebhookHandler = (
  context: WebhookContext
) => WebhookResult | Promise<WebhookResult>;

export type WebhookLogStatus = "success" | "failed" | "pending";

export type StatusWithCode =
  | { label: "pending"; code: number | null }
  | { label: "success"; code: number }
  | { label: "failed"; code: number };

export type LogDirection = "incoming" | "outgoing";

export type IntegrationType =
  | "github"
  | "linear"
  | "slack"
  | "webhook"
  | "manual"
  | "schedule";

export interface Log {
  id: string;
  referenceId: string | null;
  title: string;
  integrationType: IntegrationType;
  direction: LogDirection;
  status: WebhookLogStatus;
  statusCode: number | null;
  errorMessage: string | null;
  payload?: Record<string, unknown> | null;
  createdAt: string;
}

export interface LogsResponse {
  logs: Log[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface GithubProcessedEvent {
  type: string;
  action: string;
  data: Record<string, unknown>;
}

export type GithubMemoryEventType = Exclude<GitHubEventType, "ping">;

export interface GithubCreateMemoryEntryProps {
  organizationId: string;
  eventType: GithubMemoryEventType;
  repository: string;
  action: string;
  data: Record<string, unknown>;
  customId: string;
}

export interface WebhookLogInput {
  organizationId: string;
  integrationId: string;
  integrationType: IntegrationType;
  title: string;
  status: "success" | "failed" | "pending";
  statusCode: number | null;
  referenceId?: string | null;
  errorMessage?: string | null;
  payload?: Record<string, unknown> | null;
  retentionDays?: LogRetentionDays;
}

export type LogRetentionDays = 7 | 30;
