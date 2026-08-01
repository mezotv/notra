import type { SignalSummary } from "@notra/ai/types/autonomy";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

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
    parts.push(`${data.commits.length} commits`);
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
