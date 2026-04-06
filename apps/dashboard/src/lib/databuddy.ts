import { Databuddy } from "@databuddy/sdk/node";
import type {
  ContentCreatedTrackingEvent,
  ContentFailedTrackingEvent,
} from "@notra/content-generation/databuddy";
import {
  buildContentCreatedDatabuddyProperties,
  buildContentFailedDatabuddyProperties,
  CONTENT_CREATED_DATABUDDY_EVENT,
  CONTENT_FAILED_DATABUDDY_EVENT,
} from "@notra/content-generation/databuddy";

const apiKey = process.env.DATABUDDY_API_KEY;

if (!apiKey) {
  console.warn(
    "DATABUDDY_API_KEY not configured. Server-side Databuddy tracking will be disabled."
  );
}

export const databuddy = apiKey
  ? new Databuddy({
      websiteId: process.env.DATABUDDY_DASHBOARD_WEBSITE_ID,
      apiKey,
      enableBatching: false,
    })
  : null;

const isDevelopment = process.env.NODE_ENV === "development";

export async function trackScheduledContentCreated(
  event: ContentCreatedTrackingEvent
): Promise<void> {
  if (!databuddy) {
    return;
  }

  try {
    const result = await databuddy.track({
      name: CONTENT_CREATED_DATABUDDY_EVENT,
      namespace: "workflows",
      source: event.source ?? "schedule",
      properties: buildContentCreatedDatabuddyProperties(event),
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

export async function trackScheduledContentFailed(
  event: ContentFailedTrackingEvent
): Promise<void> {
  if (!databuddy) {
    return;
  }

  try {
    const result = await databuddy.track({
      name: CONTENT_FAILED_DATABUDDY_EVENT,
      namespace: "workflows",
      source: event.source ?? "schedule",
      properties: buildContentFailedDatabuddyProperties(event),
    });

    if (!result.success && isDevelopment) {
      console.warn("[Databuddy] scheduled_content_failed failed", {
        triggerId: event.triggerId,
        error: result.error,
      });
    }
  } catch (error) {
    if (isDevelopment) {
      console.warn("[Databuddy] scheduled_content_failed error", {
        triggerId: event.triggerId,
        error,
      });
    }
  }
}
