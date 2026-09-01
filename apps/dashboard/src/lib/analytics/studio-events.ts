import {
  CHAT_ATTACHMENT_SIZE_BUCKET_LIMITS,
  CHAT_CONTEXT_KIND_PREFIXES,
} from "@/constants/studio-analytics";
import type {
  ChatAttachmentSizeBucket,
  ChatContextKind,
  ContentDataPointFlags,
  MessageLike,
} from "@/types/analytics/studio-events";

export function getChatAttachmentSizeBucket(
  size: number
): ChatAttachmentSizeBucket {
  if (size < CHAT_ATTACHMENT_SIZE_BUCKET_LIMITS.lt_1mb) {
    return "lt_1mb";
  }
  if (size < CHAT_ATTACHMENT_SIZE_BUCKET_LIMITS.lt_5mb) {
    return "lt_5mb";
  }
  if (size < CHAT_ATTACHMENT_SIZE_BUCKET_LIMITS.lt_20mb) {
    return "lt_20mb";
  }
  return "gte_20mb";
}

export function getChatContextKind(type: string): ChatContextKind | string {
  for (const [prefix, kind] of Object.entries(CHAT_CONTEXT_KIND_PREFIXES)) {
    if (type.startsWith(prefix)) {
      return kind;
    }
  }
  return type;
}

export function getChatContextKinds(
  items: readonly { type: string }[]
): string[] {
  return items.map((item) => getChatContextKind(item.type));
}

export function countMessageFileParts(
  message: MessageLike | undefined
): number {
  if (!message?.parts) {
    return 0;
  }
  let count = 0;
  for (const part of message.parts) {
    if (part.type === "file") {
      count += 1;
    }
  }
  return count;
}

export function getEnabledDataPoints(
  dataPoints: ContentDataPointFlags
): string[] {
  const enabled: string[] = [];
  if (dataPoints.includePullRequests) {
    enabled.push("pull_requests");
  }
  if (dataPoints.includeCommits) {
    enabled.push("commits");
  }
  if (dataPoints.includeReleases) {
    enabled.push("releases");
  }
  if (dataPoints.includeLinearData) {
    enabled.push("linear");
  }
  return enabled;
}
