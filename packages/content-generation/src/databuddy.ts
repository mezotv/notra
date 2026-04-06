export const CONTENT_CREATED_DATABUDDY_EVENT = "scheduled_content_created";
export const CONTENT_FAILED_DATABUDDY_EVENT = "scheduled_content_failed";

export type ContentCreationMode = "automatic" | "manual";
export type DatabuddyWorkflowSource = "schedule" | "event" | "on_demand";

interface BaseContentTrackingEvent {
  triggerId: string;
  organizationId: string;
  outputType: string;
  creationMode: ContentCreationMode;
  source?: DatabuddyWorkflowSource;
}

export interface ContentCreatedTrackingEvent extends BaseContentTrackingEvent {
  postId: string;
  lookbackWindow: string;
  repositoryCount: number;
}

export interface ContentFailedTrackingEvent extends BaseContentTrackingEvent {
  reason: string;
  lookbackWindow?: string;
  repositoryCount?: number;
}

export function buildContentCreatedDatabuddyProperties(
  event: ContentCreatedTrackingEvent
) {
  return {
    trigger_id: event.triggerId,
    organization_id: event.organizationId,
    post_id: event.postId,
    output_type: event.outputType,
    creation_mode: event.creationMode,
    lookback_window: event.lookbackWindow,
    repository_count: event.repositoryCount,
  };
}

export function buildContentFailedDatabuddyProperties(
  event: ContentFailedTrackingEvent
) {
  return {
    trigger_id: event.triggerId,
    organization_id: event.organizationId,
    output_type: event.outputType,
    creation_mode: event.creationMode,
    reason: event.reason,
    lookback_window: event.lookbackWindow,
    repository_count: event.repositoryCount,
  };
}
