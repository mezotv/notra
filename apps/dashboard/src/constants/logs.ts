import type {
  LogSourceFilter,
  LogStatusFilter,
} from "@/types/webhooks/webhooks";

export const SOURCE_VALUES = [
  "all",
  "github",
  "linear",
  "webhook",
  "manual",
  "schedule",
  "events",
] as const satisfies readonly LogSourceFilter[];

export const STATUS_VALUES = [
  "all",
  "success",
  "failed",
  "pending",
] as const satisfies readonly LogStatusFilter[];

export const SOURCE_LABELS: Record<LogSourceFilter, string> = {
  all: "All sources",
  github: "GitHub",
  linear: "Linear",
  webhook: "Webhook",
  manual: "Manual",
  schedule: "Schedule",
  events: "Events",
};

export const STATUS_LABELS: Record<LogStatusFilter, string> = {
  all: "All statuses",
  success: "Success",
  failed: "Failed",
  pending: "Pending",
};
