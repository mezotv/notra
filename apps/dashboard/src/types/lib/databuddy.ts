export interface ScheduledContentCreatedEvent {
  triggerId: string;
  organizationId: string;
  postId: string;
  outputType: string;
  lookbackWindow: string;
  repositoryCount: number;
  source?: "schedule" | "event";
}

export interface ScheduledContentFailedEvent {
  triggerId: string;
  organizationId: string;
  outputType: string;
  reason: string;
  lookbackWindow?: string;
  repositoryCount?: number;
  source?: "schedule" | "event";
}
