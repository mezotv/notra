import { Databuddy } from "@databuddy/sdk/node";

const apiKey = process.env.DATABUDDY_API_KEY;

if (!apiKey) {
  console.warn(
    "DATABUDDY_API_KEY not configured. Server-side Databuddy tracking will be disabled."
  );
}

export const databuddy = apiKey
  ? new Databuddy({
      apiKey,
      enableBatching: false,
    })
  : null;

const isDevelopment = process.env.NODE_ENV === "development";

interface ScheduledContentCreatedEvent {
  triggerId: string;
  organizationId: string;
  postId: string;
  outputType: string;
  lookbackWindow: string;
  repositoryCount: number;
}

export async function trackScheduledContentCreated(
  event: ScheduledContentCreatedEvent
): Promise<void> {
  if (!databuddy) {
    return;
  }

  try {
    const result = await databuddy.track({
      name: "scheduled_content_created",
      namespace: "workflows",
      source: "schedule",
      properties: {
        trigger_id: event.triggerId,
        organization_id: event.organizationId,
        post_id: event.postId,
        output_type: event.outputType,
        lookback_window: event.lookbackWindow,
        repository_count: event.repositoryCount,
      },
    });

    if (!result.success && isDevelopment) {
      console.warn("[Databuddy] scheduled_content_created failed", {
        triggerId: event.triggerId,
        postId: event.postId,
        error: result.error,
      });
    }
  } catch (error) {
    if (isDevelopment) {
      console.warn("[Databuddy] scheduled_content_created error", {
        triggerId: event.triggerId,
        postId: event.postId,
        error,
      });
    }
  }
}
