import type { CapturedNetworkRequest, CaptureResult } from "posthog-js";
import {
  POSTHOG_CAMEL_CASE_BOUNDARY_PATTERN,
  POSTHOG_URL_COMPONENT_PROPERTY_PATTERN,
  POSTHOG_URL_PROPERTY_PATTERN,
  POSTHOG_URL_SHAPE_PATTERN,
  POSTHOG_URL_WHITESPACE_PATTERN,
} from "@/constants/posthog-redaction";

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
  const redactedProperties = redactPostHogPropertyValue(
    properties,
    undefined,
    new WeakMap()
  );

  return isPlainRecord(redactedProperties) ? redactedProperties : properties;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isUrlPropertyName(propertyName: string | undefined): boolean {
  if (!propertyName) {
    return false;
  }

  const normalizedPropertyName = propertyName.replace(
    POSTHOG_CAMEL_CASE_BOUNDARY_PATTERN,
    "$1_$2"
  );
  return POSTHOG_URL_PROPERTY_PATTERN.test(normalizedPropertyName);
}

function isUrlComponentPropertyName(propertyName: string | undefined): boolean {
  if (!propertyName) {
    return false;
  }

  return POSTHOG_URL_COMPONENT_PROPERTY_PATTERN.test(propertyName);
}

function isUrlWithQueryOrHash(
  value: string,
  propertyName: string | undefined
): boolean {
  const redactedValue = stripUrlQueryAndHash(value);
  if (redactedValue.length === value.length) {
    return false;
  }

  if (
    isUrlPropertyName(propertyName) ||
    isUrlComponentPropertyName(propertyName)
  ) {
    return true;
  }

  if (
    redactedValue.length === 0 ||
    POSTHOG_URL_WHITESPACE_PATTERN.test(value)
  ) {
    return false;
  }

  return POSTHOG_URL_SHAPE_PATTERN.test(value);
}

function redactPostHogPropertyValue(
  value: unknown,
  propertyName: string | undefined,
  redactedValues: WeakMap<object, unknown>
): unknown {
  if (typeof value === "string") {
    return isUrlWithQueryOrHash(value, propertyName)
      ? stripUrlQueryAndHash(value)
      : value;
  }

  if (Array.isArray(value)) {
    const cachedValue = redactedValues.get(value);
    if (cachedValue) {
      return cachedValue;
    }

    let changed = false;
    const redactedItems: unknown[] = [];
    redactedValues.set(value, redactedItems);

    for (const item of value) {
      const redactedItem = redactPostHogPropertyValue(
        item,
        propertyName,
        redactedValues
      );
      redactedItems.push(redactedItem);
      changed ||= redactedItem !== item;
    }

    const redactedValue = changed ? redactedItems : value;
    redactedValues.set(value, redactedValue);
    return redactedValue;
  }

  if (isPlainRecord(value)) {
    const cachedValue = redactedValues.get(value);
    if (cachedValue) {
      return cachedValue;
    }

    let changed = false;
    const redactedRecord: Record<string, unknown> = {};
    redactedValues.set(value, redactedRecord);

    for (const [key, nestedValue] of Object.entries(value)) {
      const redactedNestedValue = redactPostHogPropertyValue(
        nestedValue,
        key,
        redactedValues
      );
      redactedRecord[key] = redactedNestedValue;
      changed ||= redactedNestedValue !== nestedValue;
    }

    const redactedValue = changed ? redactedRecord : value;
    redactedValues.set(value, redactedValue);
    return redactedValue;
  }

  return value;
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
