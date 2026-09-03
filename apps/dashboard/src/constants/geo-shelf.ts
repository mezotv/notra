export const GEO_SHELF_SOURCE_KINDS = [
  "listicle",
  "review_site",
  "community",
  "news",
  "docs",
  "video",
  "other",
] as const;

export const GEO_SHELF_OWNERSHIPS = [
  "third_party",
  "own",
  "competitor",
] as const;

export const GEO_SHELF_ORIGINS = ["scan", "manual"] as const;

export const GEO_SHELF_FETCH_STATUSES = [
  "pending",
  "ok",
  "blocked",
  "failed",
] as const;

export const GEO_SHELF_PLACEMENT_STATUSES = [
  "present",
  "absent",
  "unknown",
] as const;

export const GEO_SHELF_PLACEMENT_EVIDENCES = ["fetch", "manual"] as const;

export const GEO_SHELF_OPPORTUNITY_STATUSES = [
  "open",
  "in_progress",
  "won",
  "lost",
  "dismissed",
] as const;

export const GEO_SHELF_PRIORITIES = ["low", "medium", "high"] as const;

export const GEO_SHELF_SHELF_FILTERS = [
  "all",
  "opportunities",
  "on_shelf",
  "unknown",
] as const;

export const GEO_SHELF_TICKET_FILTERS = [
  "any",
  "open",
  "in_progress",
  "mine",
  "unassigned",
  "closed",
] as const;

export const GEO_SHELF_SOURCE_KIND_LABELS: Record<
  (typeof GEO_SHELF_SOURCE_KINDS)[number],
  string
> = {
  listicle: "Listicle",
  review_site: "Review site",
  community: "Community",
  news: "News",
  docs: "Docs",
  video: "Video",
  other: "Other",
};

export const GEO_SHELF_OWNERSHIP_LABELS: Record<
  (typeof GEO_SHELF_OWNERSHIPS)[number],
  string
> = {
  third_party: "Third party",
  own: "Your site",
  competitor: "Competitor site",
};

export const GEO_SHELF_PLACEMENT_LABELS: Record<
  (typeof GEO_SHELF_PLACEMENT_STATUSES)[number],
  string
> = {
  present: "On shelf",
  absent: "Missing",
  unknown: "Unknown",
};

export const GEO_SHELF_OPPORTUNITY_STATUS_LABELS: Record<
  (typeof GEO_SHELF_OPPORTUNITY_STATUSES)[number],
  string
> = {
  open: "Open",
  in_progress: "In progress",
  won: "Won",
  lost: "Lost",
  dismissed: "Dismissed",
};

export const GEO_SHELF_PRIORITY_LABELS: Record<
  (typeof GEO_SHELF_PRIORITIES)[number],
  string
> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const GEO_SHELF_FETCH_STATUS_LABELS: Record<
  (typeof GEO_SHELF_FETCH_STATUSES)[number],
  string
> = {
  pending: "Not checked yet",
  ok: "Verified",
  blocked: "Page blocked our fetch",
  failed: "Fetch failed",
};

export const GEO_SHELF_SHELF_FILTER_OPTIONS: {
  value: (typeof GEO_SHELF_SHELF_FILTERS)[number];
  label: string;
  description: string;
}[] = [
  {
    value: "all",
    label: "All shelves",
    description: "Every page engines cite for your prompts",
  },
  {
    value: "opportunities",
    label: "Opportunities",
    description: "Competitors are on the page and you are not",
  },
  {
    value: "on_shelf",
    label: "You're on it",
    description: "Pages where your brand is already present",
  },
  {
    value: "unknown",
    label: "Unverified",
    description: "Presence not checked yet or the page blocked us",
  },
];

export const GEO_SHELF_TICKET_FILTER_OPTIONS: {
  value: (typeof GEO_SHELF_TICKET_FILTERS)[number];
  label: string;
}[] = [
  { value: "any", label: "Any ticket state" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "mine", label: "Assigned to me" },
  { value: "unassigned", label: "Unassigned" },
  { value: "closed", label: "Closed" },
];

export const GEO_SHELF_OPEN_STATUSES: readonly (typeof GEO_SHELF_OPPORTUNITY_STATUSES)[number][] =
  ["open", "in_progress"];

export const GEO_SHELF_TABLE_ROW_HEIGHT = 56;
export const GEO_SHELF_TABLE_HEIGHT = 560;
export const GEO_SHELF_ENGINE_STACK_LIMIT = 3;
export const GEO_SHELF_COMPETITOR_STACK_LIMIT = 4;
export const GEO_SHELF_NOTES_MAX_LENGTH = 2000;
export const GEO_SHELF_TITLE_MAX_LENGTH = 200;
export const GEO_SHELF_URL_MAX_LENGTH = 2048;
export const GEO_SHELF_CITATION_WINDOW_DAYS = 30;
export const GEO_SHELF_ADD_HOTKEY = "S";
export const GEO_SHELF_POC_SAME_AS_ASSIGNEE = "__assignee__";
export const GEO_SHELF_UNASSIGNED = "__unassigned__";
export const GEO_SHELF_NO_PRIORITY = "__none__";
export const GEO_SHELF_PREVIEW_DEBOUNCE_MS = 600;
export const GEO_SHELF_PREVIEW_STALE_MS = 10 * 60 * 1000;
export const GEO_SHELF_PREVIEW_TIMEOUT_MS = 30_000;
export const GEO_SHELF_PREVIEW_CACHE_MS = 7 * 24 * 60 * 60 * 1000;

export const GEO_SHELF_VIEWS = ["table", "board"] as const;
export const GEO_SHELF_DEFAULT_VIEW: (typeof GEO_SHELF_VIEWS)[number] = "table";
export const GEO_SHELF_VIEW_LABELS: Record<
  (typeof GEO_SHELF_VIEWS)[number],
  string
> = {
  table: "Table",
  board: "Board",
};

export const GEO_SHELF_KANBAN_NO_TICKET_COLUMN = "no_ticket";
export const GEO_SHELF_KANBAN_COLUMNS: { id: string; name: string }[] = [
  { id: GEO_SHELF_KANBAN_NO_TICKET_COLUMN, name: "No ticket" },
  { id: "open", name: GEO_SHELF_OPPORTUNITY_STATUS_LABELS.open },
  { id: "in_progress", name: GEO_SHELF_OPPORTUNITY_STATUS_LABELS.in_progress },
  { id: "won", name: GEO_SHELF_OPPORTUNITY_STATUS_LABELS.won },
  { id: "lost", name: GEO_SHELF_OPPORTUNITY_STATUS_LABELS.lost },
  { id: "dismissed", name: GEO_SHELF_OPPORTUNITY_STATUS_LABELS.dismissed },
];
