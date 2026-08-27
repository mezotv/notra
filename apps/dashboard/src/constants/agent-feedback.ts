import type {
  AgentFeedbackKind,
  AgentFeedbackSentiment,
  AgentFeedbackStatus,
} from "@notra/db/types/agent-feedback";

import type {
  AgentFeedbackClientBrandRule,
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

export const AGENT_FEEDBACK_TOKEN_GENERATION_MISSING = "missing";
export const AGENT_FEEDBACK_UNSPECIFIED_LABEL = "Unspecified";

export const AGENT_FEEDBACK_STATUS_ICON_CLASS: Record<
  AgentFeedbackStatus,
  string
> = {
  new: "text-violet-500",
  triaged: "text-amber-500",
  resolved: "text-emerald-500",
  archived: "text-muted-foreground",
};

export const AGENT_FEEDBACK_LABEL_PILL_CLASS =
  "inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-xs font-medium";

export const AGENT_FEEDBACK_KIND_PILL_CLASS: Record<AgentFeedbackKind, string> =
  {
    bug: "border-red-200/80 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200",
    feature:
      "border-sky-200/80 bg-sky-50 text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200",
    praise:
      "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200",
    question:
      "border-amber-200/80 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200",
    other: "border-border bg-muted/50 text-muted-foreground dark:bg-muted/30",
  };

export const AGENT_FEEDBACK_KIND_DOT_CLASS: Record<AgentFeedbackKind, string> =
  {
    bug: "bg-red-500",
    feature: "bg-sky-500",
    praise: "bg-emerald-500",
    question: "bg-amber-500",
    other: "bg-muted-foreground",
  };

export const AGENT_FEEDBACK_SENTIMENT_PILL_CLASS: Record<
  AgentFeedbackSentiment,
  string
> = {
  negative:
    "border-red-200/80 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200",
  neutral: "border-border bg-muted/50 text-muted-foreground dark:bg-muted/30",
  positive:
    "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200",
};

export const AGENT_FEEDBACK_SENTIMENT_DOT_CLASS: Record<
  AgentFeedbackSentiment,
  string
> = {
  negative: "bg-red-500",
  neutral: "bg-muted-foreground",
  positive: "bg-emerald-500",
};

export const AGENT_FEEDBACK_CLIENT_BRAND_RULES: readonly AgentFeedbackClientBrandRule[] =
  [
    { brand: "claude", aliases: ["claude", "anthropic"] },
    { brand: "cursor", aliases: ["cursor"] },
    { brand: "openai", aliases: ["openai", "chatgpt"] },
    { brand: "vercel", aliases: ["vercel"] },
    { brand: "windsurf", aliases: ["windsurf", "cascade"] },
    { brand: "amp", aliases: ["amp", "sourcegraph"] },
    { brand: "playwright", aliases: ["playwright"] },
    { brand: "notra", aliases: ["notra"] },
    { brand: "cline", aliases: ["cline"] },
    { brand: "devin", aliases: ["devin"] },
    { brand: "copilot", aliases: ["copilot"] },
    { brand: "gemini", aliases: ["gemini"] },
  ];
