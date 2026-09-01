import { POSTHOG_GROUP_TYPES } from "@notra/posthog/constants/posthog";
import {
  getPostHogRequestContext,
  resolvePostHogDistinctId,
} from "@notra/posthog/request";
import {
  captureServerEvent,
  captureServerException,
  flushPostHogServer,
  identifyServerGroup,
  setServerPersonProperties,
} from "@notra/posthog/server";
import { after } from "next/server";

import type {
  IdentifyOrganizationGroupInput,
  IdentifyProjectGroupInput,
  SetPersonPropertiesInput,
  TrackServerEventInput,
  TrackServerExceptionInput,
} from "@/types/analytics/posthog";

function scheduleFlush(): void {
  try {
    after(() => flushPostHogServer());
  } catch {
    void flushPostHogServer();
  }
}

export function trackServerEvent(input: TrackServerEventInput): void {
  const requestContext = getPostHogRequestContext(input.headers);
  captureServerEvent({
    event: input.event,
    distinctId: resolvePostHogDistinctId(requestContext, input.userId),
    sessionId: requestContext.sessionId,
    organizationId: input.organizationId,
    projectId: input.projectId,
    properties: input.properties,
  });
  scheduleFlush();
}

export async function trackServerEventAndFlush(
  input: TrackServerEventInput
): Promise<void> {
  const requestContext = getPostHogRequestContext(input.headers);
  captureServerEvent({
    event: input.event,
    distinctId: resolvePostHogDistinctId(requestContext, input.userId),
    sessionId: requestContext.sessionId,
    organizationId: input.organizationId,
    projectId: input.projectId,
    properties: input.properties,
  });
  await flushPostHogServer();
}

export function trackServerException(input: TrackServerExceptionInput): void {
  const requestContext = getPostHogRequestContext(input.headers);
  captureServerException({
    error: input.error,
    distinctId: resolvePostHogDistinctId(requestContext, input.userId),
    sessionId: requestContext.sessionId,
    organizationId: input.organizationId,
    properties: input.properties,
  });
  scheduleFlush();
}

export function identifyOrganizationGroup(
  input: IdentifyOrganizationGroupInput
): void {
  identifyServerGroup({
    groupType: POSTHOG_GROUP_TYPES.ORGANIZATION,
    groupKey: input.organizationId,
    properties: input.properties,
    distinctId: input.userId,
  });
  scheduleFlush();
}

export function identifyProjectGroup(input: IdentifyProjectGroupInput): void {
  identifyServerGroup({
    groupType: POSTHOG_GROUP_TYPES.PROJECT,
    groupKey: input.projectId,
    properties: {
      ...input.properties,
      organization_id: input.organizationId,
    },
    distinctId: input.userId,
  });
  scheduleFlush();
}

export function setPersonProperties(input: SetPersonPropertiesInput): void {
  setServerPersonProperties({
    distinctId: input.userId,
    set: input.set,
    setOnce: input.setOnce,
  });
  scheduleFlush();
}
