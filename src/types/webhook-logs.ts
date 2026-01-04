export type WebhookLogStatus = "success" | "failed" | "pending";

export type LogDirection = "incoming" | "outgoing";

export type IntegrationType = "github" | "linear" | "slack" | "webhook";

export interface Log {
  id: string;
  title: string;
  integrationType: IntegrationType;
  direction: LogDirection;
  status: WebhookLogStatus;
  statusCode: number | null;
  responseTime: number | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface WebhookLog {
  id: string;
  eventType: string;
  source: string;
  status: WebhookLogStatus;
  statusCode: number | null;
  requestUrl: string;
  requestMethod: string;
  responseTime: number | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface WebhookLogsResponse {
  logs: WebhookLog[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
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
