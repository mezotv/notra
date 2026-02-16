export interface ScheduledContentCreatedEvent {
  triggerId: string;
  organizationId: string;
  postId: string;
  outputType: string;
  lookbackWindow: string;
  repositoryCount: number;
}
