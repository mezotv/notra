import {
  buildGithubPullRequestMergedSignalHash,
  buildGithubPushSignalHash,
  buildGithubReleaseSignalHash,
} from "@notra/ai/utils/github-signal-hash";
import {
  IRIS_SIGNAL_KIND_PULL_REQUEST_MERGED,
  IRIS_SIGNAL_KIND_PUSH,
  IRIS_SIGNAL_KIND_RELEASE_PUBLISHED,
} from "@/constants/iris";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const resolveHeadCommitSha = (
  eventData: Record<string, unknown>
): string | null => {
  const headCommit = eventData.headCommit;
  if (isRecord(headCommit) && typeof headCommit.id === "string") {
    return headCommit.id;
  }

  const commits = eventData.commits;
  if (Array.isArray(commits)) {
    const latest = commits.at(-1);
    if (isRecord(latest) && typeof latest.id === "string") {
      return latest.id;
    }
  }

  return null;
};

export const resolveIrisGithubSignalKind = (
  eventType: string,
  eventAction: string
): string | null => {
  if (eventType === "release" && eventAction === "published") {
    return IRIS_SIGNAL_KIND_RELEASE_PUBLISHED;
  }
  if (eventType === "push") {
    return IRIS_SIGNAL_KIND_PUSH;
  }
  if (eventType === "pull_request" && eventAction === "merged") {
    return IRIS_SIGNAL_KIND_PULL_REQUEST_MERGED;
  }
  return null;
};

export const resolveIrisGithubSignalHash = (input: {
  kind: string;
  repositoryId: string;
  eventData: Record<string, unknown>;
}): string | null => {
  const data = input.eventData;

  if (input.kind === IRIS_SIGNAL_KIND_RELEASE_PUBLISHED) {
    return typeof data.tagName === "string" && data.tagName.length > 0
      ? buildGithubReleaseSignalHash(input.repositoryId, data.tagName)
      : null;
  }

  if (input.kind === IRIS_SIGNAL_KIND_PUSH) {
    const headCommitSha = resolveHeadCommitSha(data);
    return headCommitSha === null
      ? null
      : buildGithubPushSignalHash(input.repositoryId, headCommitSha);
  }

  if (input.kind === IRIS_SIGNAL_KIND_PULL_REQUEST_MERGED) {
    return typeof data.number === "number"
      ? buildGithubPullRequestMergedSignalHash(input.repositoryId, data.number)
      : null;
  }

  return null;
};

const resolveHeadCommitTimestamp = (
  eventData: Record<string, unknown>
): string | null => {
  const headCommit = eventData.headCommit;
  if (isRecord(headCommit) && typeof headCommit.timestamp === "string") {
    return headCommit.timestamp;
  }

  const commits = eventData.commits;
  if (Array.isArray(commits)) {
    const latest = commits.at(-1);
    if (isRecord(latest) && typeof latest.timestamp === "string") {
      return latest.timestamp;
    }
  }

  return null;
};

export const resolveIrisGithubOccurredAt = (
  eventData: Record<string, unknown>
): Date => {
  const timestamp =
    eventData.publishedAt ??
    eventData.mergedAt ??
    resolveHeadCommitTimestamp(eventData);
  if (typeof timestamp === "string") {
    const parsed = new Date(timestamp);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
};
