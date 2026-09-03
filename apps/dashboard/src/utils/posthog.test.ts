import { describe, expect, test } from "bun:test";

import type { CaptureResult } from "posthog-js";

import { POSTHOG_EXCEPTION_TIMESTAMP_PROPERTY } from "@/constants/posthog-redaction";

import {
  normalizePostHogPageViewUrl,
  redactPostHogEvent,
  resolvePostHogNavigationType,
  shouldIgnorePostHogNavigation,
} from "./posthog";

const exceptionEvent = (
  timestamp: string,
  capturedAt = new Date("2026-01-01T00:00:00.000Z")
): CaptureResult => ({
  event: "$exception",
  properties: {
    [POSTHOG_EXCEPTION_TIMESTAMP_PROPERTY]: timestamp,
  },
  timestamp: capturedAt,
  uuid: "00000000-0000-4000-8000-000000000000",
});

describe("redactPostHogEvent", () => {
  test("preserves the occurrence time of a deferred exception", () => {
    const occurredAt = "2025-12-31T23:59:30.000Z";
    const result = redactPostHogEvent(exceptionEvent(occurredAt));

    expect(result?.timestamp).toEqual(new Date(occurredAt));
    expect(
      result?.properties[POSTHOG_EXCEPTION_TIMESTAMP_PROPERTY]
    ).toBeUndefined();
  });

  test("keeps the capture time when an exception timestamp is invalid", () => {
    const capturedAt = new Date("2026-01-01T00:00:00.000Z");
    const result = redactPostHogEvent(
      exceptionEvent("invalid timestamp", capturedAt)
    );

    expect(result?.timestamp).toEqual(capturedAt);
    expect(
      result?.properties[POSTHOG_EXCEPTION_TIMESTAMP_PROPERTY]
    ).toBeUndefined();
  });
});

describe("PostHog navigation metadata", () => {
  test.each([
    ["push", "pushState"],
    ["replace", "replaceState"],
    ["traverse", "popstate"],
  ] as const)("maps %s transitions to %s", (transition, expected) => {
    expect(resolvePostHogNavigationType(transition)).toBe(expected);
  });

  test("preserves query updates while ignoring URL fragments", () => {
    expect(
      normalizePostHogPageViewUrl(
        "/acme/geo?project=next#chart",
        "https://app.notra.test/acme/geo?project=current"
      )
    ).toBe("https://app.notra.test/acme/geo?project=next");
  });

  test.each(["push", "replace"] as const)(
    "ignores same-page %s transitions after hash normalization",
    (transition) => {
      expect(
        shouldIgnorePostHogNavigation(
          "/acme/geo?project=current#chart",
          "https://app.notra.test/acme/geo?project=current#summary",
          transition
        )
      ).toBe(true);
    }
  );

  test("retains traverse metadata when history already changed the URL", () => {
    const currentUrl = "https://app.notra.test/acme/geo?project=previous";

    expect(
      shouldIgnorePostHogNavigation(currentUrl, currentUrl, "traverse")
    ).toBe(false);
  });
});
