"use client";

import type { PostHogEventName } from "@notra/posthog/events";
import type { PostHogProperties } from "@notra/posthog/types/posthog";
import type { RouterTransitionType } from "next";

import {
  POSTHOG_CONFIG,
  POSTHOG_IDLE_TIMEOUT_MS,
  POSTHOG_INITIALIZATION_TIMEOUT_MS,
  POSTHOG_MAX_PENDING_OPERATIONS,
  POSTHOG_NAVIGATION_WAIT_MS,
  POSTHOG_PROJECT_TOKEN,
  POSTHOG_RETRY_DELAYS_MS,
} from "@/constants/posthog";
import { POSTHOG_EXCEPTION_TIMESTAMP_PROPERTY } from "@/constants/posthog-redaction";
import type {
  PendingPostHogNavigation,
  PendingPostHogOperation,
  PostHogClient,
  PostHogClientOperation,
  PostHogStateOperationKey,
} from "@/types/analytics/posthog";
import {
  normalizePostHogPageViewUrl,
  resolvePostHogNavigationType,
  shouldIgnorePostHogNavigation,
} from "@/utils/posthog";

let postHogPromise: Promise<PostHogClient | null> | null = null;
let postHogClient: PostHogClient | null = null;
let initializationRequested = false;
let retryAttempt = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let lastTrackedPageViewUrl: string | null = null;
const pendingOperations: PendingPostHogOperation[] = [];
const pendingNavigations = new Map<string, PendingPostHogNavigation>();
const pendingStateOperations = new Map<
  PostHogStateOperationKey,
  PostHogClientOperation
>();

function scheduleRetry(): void {
  const delay = POSTHOG_RETRY_DELAYS_MS[retryAttempt];
  if (!(initializationRequested && delay !== undefined) || retryTimer) {
    return;
  }

  retryAttempt += 1;
  retryTimer = globalThis.setTimeout(() => {
    retryTimer = null;
    void getPostHog();
  }, delay);
}

function runSafely(operation: PostHogClientOperation, posthog: PostHogClient) {
  try {
    operation(posthog);
  } catch {
    // Analytics must never affect product behavior.
  }
}

function flushPendingOperations(posthog: PostHogClient): void {
  const appliedStateOperations = new Map<
    PostHogStateOperationKey,
    PostHogClientOperation
  >();

  for (const pendingOperation of pendingOperations.splice(0)) {
    for (const [key, stateOperation] of pendingOperation.stateOperations) {
      if (appliedStateOperations.get(key) === stateOperation) {
        continue;
      }
      appliedStateOperations.set(key, stateOperation);
      runSafely(stateOperation, posthog);
    }
    runSafely(pendingOperation.operation, posthog);
  }

  for (const [key, stateOperation] of pendingStateOperations) {
    if (appliedStateOperations.get(key) !== stateOperation) {
      runSafely(stateOperation, posthog);
    }
  }
  pendingStateOperations.clear();
}

function runPostHogOperation(operation: PostHogClientOperation): boolean {
  if (!postHogClient) {
    return false;
  }

  try {
    operation(postHogClient);
  } catch {
    // Analytics must never affect product behavior.
  }
  return true;
}

function getPostHog() {
  const projectToken = POSTHOG_PROJECT_TOKEN;
  if (!(projectToken && typeof window !== "undefined")) {
    return Promise.resolve(null);
  }

  if (postHogPromise) {
    return postHogPromise;
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timedImport = Promise.race([
    import("posthog-js"),
    new Promise<never>((_resolve, reject) => {
      timeout = globalThis.setTimeout(
        () => reject(new Error("PostHog initialization timed out")),
        POSTHOG_INITIALIZATION_TIMEOUT_MS
      );
    }),
  ]).finally(() => {
    if (timeout) {
      globalThis.clearTimeout(timeout);
    }
  });

  const currentAttempt: Promise<PostHogClient | null> = timedImport
    .then(({ default: posthog }) => {
      if (!posthog.__loaded) {
        posthog.init(projectToken, {
          ...POSTHOG_CONFIG,
          tracing_headers: [window.location.hostname],
        });
      }
      postHogClient = posthog;
      retryAttempt = 0;
      flushPendingOperations(posthog);
      return posthog;
    })
    .catch(() => {
      if (postHogPromise === currentAttempt) {
        postHogPromise = null;
        scheduleRetry();
      }
      return null;
    });
  postHogPromise = currentAttempt;

  return postHogPromise;
}

function requestPostHogInitialization(): Promise<PostHogClient | null> {
  initializationRequested = true;
  return getPostHog();
}

function enqueuePostHogOperation(operation: PostHogClientOperation): void {
  if (!(POSTHOG_PROJECT_TOKEN && typeof window !== "undefined")) {
    return;
  }

  if (runPostHogOperation(operation)) {
    return;
  }

  if (pendingOperations.length >= POSTHOG_MAX_PENDING_OPERATIONS) {
    pendingOperations.shift();
  }
  pendingOperations.push({
    operation,
    stateOperations: new Map(pendingStateOperations),
  });
  if (initializationRequested && !postHogPromise) {
    void getPostHog();
  }
}

export function enqueuePostHogStateOperation(
  key: PostHogStateOperationKey,
  operation: PostHogClientOperation
): void {
  if (!(POSTHOG_PROJECT_TOKEN && typeof window !== "undefined")) {
    return;
  }

  if (runPostHogOperation(operation)) {
    return;
  }

  pendingStateOperations.set(key, operation);
  if (initializationRequested && !postHogPromise) {
    void getPostHog();
  }
}

export function initializePostHogWhenIdle(): void {
  if (!(POSTHOG_PROJECT_TOKEN && typeof window !== "undefined")) {
    return;
  }

  const initialize = () => {
    void requestPostHogInitialization();
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(initialize, {
      timeout: POSTHOG_IDLE_TIMEOUT_MS,
    });
    return;
  }

  globalThis.setTimeout(initialize, POSTHOG_IDLE_TIMEOUT_MS);
}

export function trackEvent(
  event: PostHogEventName,
  properties?: PostHogProperties
): void {
  if (!POSTHOG_PROJECT_TOKEN) {
    return;
  }
  const timestamp = new Date();
  enqueuePostHogOperation((posthog) =>
    posthog.capture(event, properties, { timestamp })
  );
  void requestPostHogInitialization();
}

export async function trackEventBeforeNavigation(
  event: PostHogEventName,
  properties?: PostHogProperties
): Promise<void> {
  if (!POSTHOG_PROJECT_TOKEN) {
    return;
  }

  const timestamp = new Date();
  enqueuePostHogOperation((posthog) =>
    posthog.capture(event, properties, {
      send_instantly: true,
      timestamp,
      transport: "sendBeacon",
    })
  );

  const initialization = requestPostHogInitialization().then((client) => {
    if (client) {
      return;
    }
    return new Promise<void>(() => undefined);
  });
  await Promise.race([
    initialization,
    new Promise<void>((resolve) => {
      globalThis.setTimeout(resolve, POSTHOG_NAVIGATION_WAIT_MS);
    }),
  ]);
}

export function notePostHogNavigation(
  url: string,
  navigationType: RouterTransitionType
): void {
  if (!(POSTHOG_PROJECT_TOKEN && typeof window !== "undefined")) {
    return;
  }

  const normalizedUrl = normalizePostHogPageViewUrl(url, window.location.href);
  if (
    shouldIgnorePostHogNavigation(url, window.location.href, navigationType)
  ) {
    return;
  }
  const capturedNavigationType = resolvePostHogNavigationType(navigationType);

  if (
    pendingNavigations.size >= POSTHOG_MAX_PENDING_OPERATIONS &&
    !pendingNavigations.has(normalizedUrl)
  ) {
    const oldestUrl = pendingNavigations.keys().next().value;
    if (oldestUrl) {
      pendingNavigations.delete(oldestUrl);
    }
  }
  pendingNavigations.set(normalizedUrl, {
    navigationType: capturedNavigationType,
    url: normalizedUrl,
  });
}

export function observePostHogHistory(): void {
  if (!(POSTHOG_PROJECT_TOKEN && typeof window !== "undefined")) {
    return;
  }

  const patchKey = "__notraPostHogHistoryPatched";
  if (Reflect.get(window, patchKey)) {
    return;
  }

  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);

  window.history.pushState = (data, unused, url) => {
    if (url !== null && url !== undefined) {
      try {
        notePostHogNavigation(String(url), "push");
      } catch {
        // Analytics must never affect browser navigation.
      }
    }
    return originalPushState(data, unused, url);
  };
  window.history.replaceState = (data, unused, url) => {
    if (url !== null && url !== undefined) {
      try {
        notePostHogNavigation(String(url), "replace");
      } catch {
        // Analytics must never affect browser navigation.
      }
    }
    return originalReplaceState(data, unused, url);
  };
  Reflect.set(window, patchKey, true);
}

export function trackPostHogPageView(url: string): void {
  if (!(POSTHOG_PROJECT_TOKEN && typeof window !== "undefined")) {
    return;
  }

  const normalizedUrl = normalizePostHogPageViewUrl(url, window.location.href);
  if (lastTrackedPageViewUrl === normalizedUrl) {
    pendingNavigations.delete(normalizedUrl);
    return;
  }
  const navigation = pendingNavigations.get(normalizedUrl) ?? null;
  pendingNavigations.delete(normalizedUrl);
  lastTrackedPageViewUrl = normalizedUrl;
  const timestamp = new Date();

  enqueuePostHogOperation((posthog) =>
    posthog.capture(
      "$pageview",
      {
        $current_url: normalizedUrl,
        ...(navigation
          ? { navigation_type: navigation.navigationType }
          : undefined),
      },
      { timestamp }
    )
  );
}

export function trackClientException(
  error: unknown,
  properties?: PostHogProperties
): void {
  if (!POSTHOG_PROJECT_TOKEN) {
    return;
  }
  const occurredAt = new Date().toISOString();
  enqueuePostHogOperation((posthog) =>
    posthog.captureException(error, {
      ...properties,
      [POSTHOG_EXCEPTION_TIMESTAMP_PROPERTY]: occurredAt,
    })
  );
  void requestPostHogInitialization();
}

export function resetPostHogIdentity(): void {
  enqueuePostHogStateOperation("identity", (posthog) => {
    posthog.reset();
  });
  enqueuePostHogStateOperation("groups", (posthog) => {
    posthog.resetGroups();
    posthog.unregister("organization_id");
    posthog.unregister("project_id");
  });
}
