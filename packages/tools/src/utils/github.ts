import { GITHUB_RATE_LIMIT_MESSAGE } from "../constants/github-tools";
import type { ErrorWithResponseStatus } from "../types/github-tools";

export class GitHubRateLimitToolError extends Error {
  readonly retryAfterSeconds?: number;

  constructor(retryAfterSeconds?: number) {
    super(GITHUB_RATE_LIMIT_MESSAGE);
    this.name = "GitHubRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function parseRetryAfterSeconds(value?: string | number) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function getHeaderCaseInsensitive(
  headers: Record<string, string | number | undefined> | undefined,
  name: string
) {
  if (!headers) {
    return undefined;
  }
  const key = Object.keys(headers).find(
    (headerName) => headerName.toLowerCase() === name.toLowerCase()
  );
  return key ? headers[key] : undefined;
}

function toGitHubRateLimitError(error: unknown) {
  const maybeError = error as ErrorWithResponseStatus;
  const status = maybeError?.status;
  const headers = maybeError?.response?.headers;

  const remaining = getHeaderCaseInsensitive(headers, "x-ratelimit-remaining");
  const retryAfter = getHeaderCaseInsensitive(headers, "retry-after");
  const resetAt = getHeaderCaseInsensitive(headers, "x-ratelimit-reset");
  const retryAfterSecondsFromHeader = parseRetryAfterSeconds(retryAfter);

  let retryAfterSeconds = retryAfterSecondsFromHeader;
  if (!retryAfterSeconds) {
    const resetEpochSeconds = parseRetryAfterSeconds(resetAt);
    if (resetEpochSeconds) {
      const nowEpochSeconds = Math.floor(Date.now() / 1000);
      const diff = resetEpochSeconds - nowEpochSeconds;
      retryAfterSeconds = diff > 0 ? diff : undefined;
    }
  }

  const isRateLimitedByStatus = status === 429;
  const isRateLimitedByForbidden =
    status === 403 && String(remaining ?? "") === "0";
  const isSecondaryRateLimit =
    status === 403 &&
    maybeError?.message?.toLowerCase().includes("secondary rate limit") ===
      true;

  if (
    isRateLimitedByStatus ||
    isRateLimitedByForbidden ||
    isSecondaryRateLimit
  ) {
    return new GitHubRateLimitToolError(retryAfterSeconds);
  }

  return null;
}

export async function withGitHubRateLimitHandling<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const rateLimitError = toGitHubRateLimitError(error);
    if (rateLimitError) {
      throw rateLimitError;
    }
    throw error;
  }
}

const LINK_HEADER_NEXT_PAGE_REGEX = /<([^>]+)>\s*;\s*rel="next"/i;

export function getNextPageFromLinkHeader(
  linkHeader?: string | number
): number | undefined {
  if (typeof linkHeader !== "string" || !linkHeader.trim()) {
    return undefined;
  }
  const nextMatch = linkHeader.match(LINK_HEADER_NEXT_PAGE_REGEX);
  if (!nextMatch?.[1]) {
    return undefined;
  }
  try {
    const url = new URL(nextMatch[1]);
    const pageValue = url.searchParams.get("page");
    if (!pageValue) {
      return undefined;
    }
    const parsed = Number.parseInt(pageValue, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export const getISODateFromDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};
