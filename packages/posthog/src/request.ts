import {
  POSTHOG_DISTINCT_ID_HEADER,
  POSTHOG_SESSION_ID_HEADER,
} from "@notra/posthog/constants/posthog";
import type { PostHogRequestContext } from "@notra/posthog/types/posthog";

interface HeaderReader {
  get(name: string): string | null | undefined;
}

function readHeader(headers: HeaderReader, name: string): string | null {
  const value = headers.get(name)?.trim();
  return value ? value : null;
}

export function getPostHogRequestContext(
  headers: HeaderReader | null | undefined
): PostHogRequestContext {
  if (!headers) {
    return { distinctId: null, sessionId: null };
  }

  return {
    distinctId: readHeader(headers, POSTHOG_DISTINCT_ID_HEADER),
    sessionId: readHeader(headers, POSTHOG_SESSION_ID_HEADER),
  };
}

export function resolvePostHogDistinctId(
  context: PostHogRequestContext,
  userId: string | null | undefined
): string | null {
  return userId ?? context.distinctId;
}
