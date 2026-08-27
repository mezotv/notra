import type { CapturedNetworkRequest, CaptureResult } from "posthog-js";

import { POSTHOG_URL_PROPERTY_PATTERN } from "@/constants/posthog-redaction";

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

function redactUrlProperties(
  properties: CaptureResult["properties"]
): CaptureResult["properties"] {
  if (!properties) {
    return properties;
  }

  const redacted: Record<string, unknown> = { ...properties };
  for (const [key, value] of Object.entries(redacted)) {
    if (typeof value === "string" && POSTHOG_URL_PROPERTY_PATTERN.test(key)) {
      redacted[key] = stripUrlQueryAndHash(value);
    }
  }

  return redacted;
}

export function redactPostHogEvent(
  event: CaptureResult | null
): CaptureResult | null {
  if (!event) {
    return null;
  }

  return {
    ...event,
    properties: redactUrlProperties(event.properties),
    $set: event.$set ? redactUrlProperties(event.$set) : undefined,
    $set_once: event.$set_once
      ? redactUrlProperties(event.$set_once)
      : undefined,
  };
}
