import type {
  AgentFeedbackKind,
  AgentFeedbackSentiment,
  AgentFeedbackStatus,
} from "@notra/db/types/agent-feedback";
import type {
  AgentFeedbackSnippetKey,
  AgentFeedbackStatusFilter,
} from "@/types/agent-feedback";

export const AGENT_FEEDBACK_NAV_LINK = "/feedback";
export const AGENT_FEEDBACK_DOCS_URL =
  "https://docs.usenotra.com/api/agent-feedback";
export const AGENT_FEEDBACK_API_BASE_URL = "https://api.usenotra.com";
export const AGENT_FEEDBACK_API_PATH = "/v1/feedback";
export const AGENT_FEEDBACK_API_URL_ENV = "FEEDBACK_API_URL";
export const AGENT_FEEDBACK_PACKAGE = "@usenotra/geo";
export const AGENT_FEEDBACK_PACKAGE_ENTRY = `${AGENT_FEEDBACK_PACKAGE}/feedback`;
export const AGENT_FEEDBACK_PAGE_SIZE = 50;
export const AGENT_FEEDBACK_SKELETON_ROWS = [
  "r1",
  "r2",
  "r3",
  "r4",
  "r5",
  "r6",
];

export const AGENT_FEEDBACK_STATUS_FILTERS: {
  value: AgentFeedbackStatusFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "triaged", label: "Triaged" },
  { value: "resolved", label: "Resolved" },
  { value: "archived", label: "Archived" },
];

export const AGENT_FEEDBACK_STATUS_LABELS: Record<AgentFeedbackStatus, string> =
  {
    new: "New",
    triaged: "Triaged",
    resolved: "Resolved",
    archived: "Archived",
  };

export const AGENT_FEEDBACK_KIND_LABELS: Record<AgentFeedbackKind, string> = {
  bug: "Bug",
  feature: "Feature",
  praise: "Praise",
  question: "Question",
  other: "Other",
};

export const AGENT_FEEDBACK_SENTIMENT_LABELS: Record<
  AgentFeedbackSentiment,
  string
> = {
  negative: "Negative",
  neutral: "Neutral",
  positive: "Positive",
};

export const AGENT_FEEDBACK_TOKEN_ENV = "NOTRA_FEEDBACK_TOKEN";

export const AGENT_FEEDBACK_DEFAULT_SNIPPET_TAB: AgentFeedbackSnippetKey =
  "mcp";

export const AGENT_FEEDBACK_SNIPPET_TABS: {
  value: AgentFeedbackSnippetKey;
  label: string;
  filename: string;
}[] = [
  { value: "mcp", label: "SDK", filename: "server.ts" },
  { value: "fetch", label: "No SDK", filename: "server.ts" },
  { value: "curl", label: "curl", filename: "terminal" },
];

export const AGENT_FEEDBACK_SNIPPET_FILENAMES: Record<
  AgentFeedbackSnippetKey,
  string
> = {
  mcp: "server.ts",
  fetch: "server.ts",
  curl: "terminal",
};

export const AGENT_FEEDBACK_TABLE_COLUMN_COUNT = 6;
export const AGENT_FEEDBACK_TOKEN_GENERATION_MISSING = "missing";
export const AGENT_FEEDBACK_UNSPECIFIED_LABEL = "Unspecified";
