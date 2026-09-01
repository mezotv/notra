import type {
  AgentFeedbackCursor,
  AgentFeedbackItem,
  AgentFeedbackRow,
} from "@/types/agent-feedback";

export function toAgentFeedbackItem(row: AgentFeedbackRow): AgentFeedbackItem {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
  };
}

export function encodeAgentFeedbackCursor(row: AgentFeedbackRow): string {
  return `${row.createdAt.toISOString()}|${row.id}`;
}

export function decodeAgentFeedbackCursor(
  cursor: string
): AgentFeedbackCursor | null {
  const separatorIndex = cursor.lastIndexOf("|");
  if (separatorIndex <= 0) {
    return null;
  }
  const createdAt = new Date(cursor.slice(0, separatorIndex));
  const id = cursor.slice(separatorIndex + 1);
  if (Number.isNaN(createdAt.getTime()) || id.length === 0) {
    return null;
  }
  return { createdAt, id };
}
