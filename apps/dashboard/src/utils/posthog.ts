import type { CapturedNetworkRequest, CaptureResult } from "posthog-js";

export function stripUrlQueryAndHash(url: string): string {
  const queryIndex = url.indexOf("?");
  const hashIndex = url.indexOf("#");
  let redactionIndex = url.length;

  if (queryIndex >= 0) {
    redactionIndex = queryIndex;
  }
  if (hashIndex >= 0 && hashIndex < redactionIndex) {
    redactionIndex = hashIndex;
  }

  return url.slice(0, redactionIndex);
}

export function redactPostHogNetworkRequest(
  request: CapturedNetworkRequest
): CapturedNetworkRequest {
  return {
    ...request,
    name: stripUrlQueryAndHash(request.name),
  };
}

function redactPostHogUrlProperties(
  properties: CaptureResult["properties"]
): CaptureResult["properties"] {
  const redactedProperties = { ...properties };

  if (typeof redactedProperties.$current_url === "string") {
    redactedProperties.$current_url = stripUrlQueryAndHash(
      redactedProperties.$current_url
    );
  }
  if (typeof redactedProperties.$initial_current_url === "string") {
    redactedProperties.$initial_current_url = stripUrlQueryAndHash(
      redactedProperties.$initial_current_url
    );
  }
  if (typeof redactedProperties.$session_entry_url === "string") {
    redactedProperties.$session_entry_url = stripUrlQueryAndHash(
      redactedProperties.$session_entry_url
    );
  }
  if (typeof redactedProperties.$referrer === "string") {
    redactedProperties.$referrer = stripUrlQueryAndHash(
      redactedProperties.$referrer
    );
  }
  if (typeof redactedProperties.$initial_referrer === "string") {
    redactedProperties.$initial_referrer = stripUrlQueryAndHash(
      redactedProperties.$initial_referrer
    );
  }

  return redactedProperties;
}

export function redactPostHogEvent(
  event: CaptureResult | null
): CaptureResult | null {
  if (!event) {
    return null;
  }

  return {
    ...event,
    properties: redactPostHogUrlProperties(event.properties),
    $set: event.$set ? redactPostHogUrlProperties(event.$set) : undefined,
    $set_once: event.$set_once
      ? redactPostHogUrlProperties(event.$set_once)
      : undefined,
  };
}
