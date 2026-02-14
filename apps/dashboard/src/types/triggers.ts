import type {
  LookbackWindow,
  OutputContentType,
  WebhookEventType,
} from "@/utils/schemas/integrations";

export type TriggerSourceType =
  | "github_webhook"
  | "linear_webhook"
  | "cron"
  | "manual";

export interface TriggerTarget {
  repositoryIds: string[];
}

export interface TriggerSourceConfig {
  eventTypes?: WebhookEventType[];
  cron?: {
    frequency: "daily" | "weekly" | "monthly";
    hour: number;
    minute: number;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
}

export interface TriggerOutputConfig {
  publishDestination?: "webflow" | "framer" | "custom";
}

export interface Trigger {
  id: string;
  organizationId: string;
  name: string;
  sourceType: TriggerSourceType;
  sourceConfig: TriggerSourceConfig;
  targets: TriggerTarget;
  outputType: OutputContentType;
  outputConfig?: TriggerOutputConfig | null;
  lookbackWindow?: LookbackWindow;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
