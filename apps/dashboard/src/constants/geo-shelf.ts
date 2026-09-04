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
export const GEO_SHELF_ADD_HOTKEY = "A";
export const GEO_SHELF_POC_SAME_AS_ASSIGNEE = "__assignee__";
export const GEO_SHELF_UNASSIGNED = "__unassigned__";
export const GEO_SHELF_NO_PRIORITY = "__none__";
export const GEO_SHELF_PREVIEW_DEBOUNCE_MS = 600;
export const GEO_SHELF_PREVIEW_STALE_MS = 10 * 60 * 1000;
export const GEO_SHELF_PREVIEW_TIMEOUT_MS = 30_000;
export const GEO_SHELF_PREVIEW_CACHE_MS = 7 * 24 * 60 * 60 * 1000;

// Shelf sources are public web pages: only http(s) URLs on a real, publicly
// resolvable hostname are accepted.
export const GEO_SHELF_URL_PROTOCOL_PATTERN = /^https?$/;
export const GEO_SHELF_BLOCKED_HOSTNAMES: readonly string[] = [
  "localhost",
  "localhost.localdomain",
  "broadcasthost",
  "metadata.google.internal",
];
export const GEO_SHELF_BLOCKED_HOSTNAME_SUFFIXES: readonly string[] = [
  ".local",
  ".localhost",
  ".localdomain",
  ".internal",
  ".intranet",
  ".lan",
  ".home",
  ".home.arpa",
  ".corp",
  ".test",
  ".example",
  ".invalid",
  ".onion",
];
export const GEO_SHELF_MIN_HOSTNAME_LABELS = 2;
export const GEO_SHELF_MIN_HOSTNAME_TLD_LENGTH = 2;

export const GEO_SHELF_TRACKING_PARAMS: readonly string[] = [
  "ref",
  "ref_src",
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
];
export const GEO_SHELF_TRACKING_PARAM_PREFIXES: readonly string[] = ["utm_"];

export const GEO_SHELF_URL_INVALID_MESSAGE =
  "Enter a public http or https page URL";
export const GEO_SHELF_DUPLICATE_URL_MESSAGE =
  "This page is already on your shelf";
export const GEO_SHELF_PREVIEW_RATE_LIMIT_MESSAGE =
  "Too many page lookups. Please wait a minute.";
export const GEO_SHELF_PREVIEW_RATE_LIMIT_SCOPE = "shelf-preview";
export const GEO_SHELF_PREVIEW_UNAVAILABLE_MESSAGE =
  "Couldn't read the page title, you can type it";

export const GEO_SHELF_ADD_LABEL = "Add shelf";
export const GEO_SHELF_NO_MATCHES_MESSAGE = "No shelves match these filters";
export const GEO_SHELF_EMPTY_TITLE = "No shelf space tracked yet";
export const GEO_SHELF_EMPTY_SCANNED_DESCRIPTION =
  "No third-party page has been cited for your prompts yet. Add a page you want to be listed on, or wait for the next scan.";
export const GEO_SHELF_EMPTY_UNSCANNED_DESCRIPTION =
  "Shelves appear once a scan cites third-party pages for your prompts. You can also add a page you want to be listed on.";
export const GEO_SHELF_SAMPLE_DATA_TITLE = "You're looking at sample data";
export const GEO_SHELF_SAMPLE_DATA_DESCRIPTION =
  "These shelves are seeded from this project's competitors and team so you can try the flow. Edits are kept in memory and reset when the server restarts.";

export const GEO_SHELF_PREVIEW_OUTCOMES = {
  RATE_LIMITED: "rate_limited",
  FETCHED: "fetched",
  UNAVAILABLE: "unavailable",
} as const;
