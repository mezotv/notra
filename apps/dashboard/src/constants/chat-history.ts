import type { ChatHistoryGroupId } from "@/types/chat";

export const CHAT_HISTORY_PINNED_LABEL = "Pinned";

export const CHAT_HISTORY_GROUP_LABELS: Record<ChatHistoryGroupId, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7Days: "Last 7 days",
  lastMonth: "Last month",
  older: "Older",
};

export const CHAT_HISTORY_GROUP_ORDER = [
  "today",
  "yesterday",
  "last7Days",
  "lastMonth",
  "older",
] as const satisfies readonly ChatHistoryGroupId[];

export const CHAT_HISTORY_LAST_7_DAYS = 7;
export const CHAT_HISTORY_LAST_MONTH_DAYS = 30;
