import type { SignalSummary } from "@notra/ai/types/autonomy";

import {
  IRIS_SIGNAL_COMMIT_SUBJECT_LIMIT,
  IRIS_SIGNAL_COMMIT_SUBJECT_MAX_LENGTH,
} from "@/constants/iris";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toCommitSubject = (commit: unknown): string | null => {
  if (!isRecord(commit) || typeof commit.message !== "string") {
    return null;
  }

  const subject = commit.message.split("\n")[0]?.trim() ?? "";
  if (subject.length === 0) {
    return null;
  }

  return subject.length <= IRIS_SIGNAL_COMMIT_SUBJECT_MAX_LENGTH
    ? subject
    : `${subject.slice(0, IRIS_SIGNAL_COMMIT_SUBJECT_MAX_LENGTH - 1).trim()}…`;
};

const describeCommits = (commits: readonly unknown[]): string => {
  const subjects = commits
    .slice(-IRIS_SIGNAL_COMMIT_SUBJECT_LIMIT)
    .map(toCommitSubject)
    .filter((subject) => subject !== null);

  if (subjects.length === 0) {
    return `${commits.length} commits`;
  }

  return `${commits.length} commits (${subjects.join("; ")})`;
};

const describeSignalPayload = (payload: unknown): string | null => {
  if (!isRecord(payload)) {
    return null;
  }

  const data = isRecord(payload.data) ? payload.data : null;
  if (!data) {
    return null;
  }

  const parts: string[] = [];

  if (typeof data.tagName === "string" && data.tagName.length > 0) {
    parts.push(`release ${data.tagName}`);
  }
  if (typeof data.name === "string" && data.name.length > 0) {
    parts.push(data.name);
  }
  if (Array.isArray(data.commits)) {
    parts.push(describeCommits(data.commits));
  }
  if (typeof payload.repositoryName === "string") {
    parts.push(payload.repositoryName);
  }

  return parts.length > 0 ? parts.join(", ") : null;
};

export const buildSignalSummaryLine = (summary: SignalSummary): string => {
  const occurredAt = summary.occurredAt.toISOString();
  const detail = describeSignalPayload(summary.payload);
  const base = `${summary.kind} from ${summary.source} at ${occurredAt}`;
  return detail ? `${base}: ${detail}` : base;
};

export const buildIrisHeadline = (
  artifactCount: number,
  signalCount: number
): string => {
  if (artifactCount === 0) {
    return `Iris reviewed ${signalCount} signals and created nothing`;
  }
  if (artifactCount === 1) {
    return `Iris drafted 1 piece of content from ${signalCount} signals`;
  }
  return `Iris drafted ${artifactCount} pieces of content from ${signalCount} signals`;
};

export const buildIrisNoOpHeadline = (
  signalCount: number,
  reason: string
): string =>
  `Iris reviewed ${signalCount} signals and decided to wait: ${reason}`;
