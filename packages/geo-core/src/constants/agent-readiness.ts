/** Public Is Agentic API (Vercel Labs); no API key required. */
export const AGENT_READINESS_API_ORIGIN = "https://is-agentic.com";
export const AGENT_READINESS_USER_AGENT = "notra-geo/1.0 (+https://notra.so)";
export const AGENT_READINESS_HTTP_NOT_FOUND = 404;
export const AGENT_READINESS_FLAG_KEY = "agent-readiness";
export const AGENT_READINESS_UNAVAILABLE_DESCRIPTION =
  "Agent Readiness is not available for this organization.";
/**
 * Error code the internal agent-readiness route returns when the feature flag
 * is off. The public API maps it onto a 403 instead of a generic start failure.
 */
export const FEATURE_NOT_ENABLED_CODE = "FEATURE_NOT_ENABLED";
/** Scans usually finish in 1-3 minutes; abort well past that. */
export const AGENT_READINESS_SCAN_TIMEOUT_MS = 8 * 60 * 1000;
export const AGENT_READINESS_REPORT_TIMEOUT_MS = 30 * 1000;
/** A running row older than this is treated as stuck and can be replaced. */
export const AGENT_READINESS_STALE_RUNNING_MS = 10 * 60 * 1000;
/** Poll cadence while a scan is in flight. */
export const AGENT_READINESS_POLL_INTERVAL_MS = 5000;
export const AGENT_READINESS_MAX_SCORE = 100;
/** Completed scans loaded for the trend chart. */
export const AGENT_READINESS_HISTORY_LIMIT = 60;
/** Score bands, mirroring the Speed Insights thresholds. */
export const AGENT_READINESS_GREAT_THRESHOLD = 90;
export const AGENT_READINESS_NEEDS_IMPROVEMENT_THRESHOLD = 50;

export const AGENT_READINESS_SCAN_DIALOG_TITLE = "Run a public scan?";
export const AGENT_READINESS_SCAN_DIALOG_BODY =
  "The scan runs through is-agentic.com, an open service by Vercel Labs. It only reads the public parts of your website and changes nothing. The resulting report is publicly retrievable on is-agentic.com by anyone who knows your domain.";
export const AGENT_READINESS_SCAN_DIALOG_CONFIRM = "Start scan";
export const AGENT_READINESS_SCAN_DIALOG_CANCEL = "Cancel";

export const AGENT_READINESS_PAGE_TITLE = "Agent Readiness";
export const AGENT_READINESS_PAGE_DESCRIPTION =
  "How well AI agents can discover, understand, and use your website";

export const AGENT_READINESS_MUST_DO_LABEL = "Must do";
export const AGENT_READINESS_MUST_DO_HINT = "Agents need these to use the site";
export const AGENT_READINESS_SHOULD_DO_LABEL = "Should do";
export const AGENT_READINESS_SHOULD_DO_HINT =
  "Makes the site easier for agents";

export const AGENT_READINESS_RESULT_ORDER = {
  failed: 0,
  partial: 1,
} as const;

export const AGENT_READINESS_PROMPT_WORK_RULES = [
  "Finish every item in Must do before starting Should do.",
  "A failed check needs a complete implementation. A partial check already has some of the pieces — close the gap described in Evidence.",
  "Stay scoped: implement the recommended fix. Do not refactor unrelated code.",
  "After each item, note the files you changed in one line.",
] as const;

export const AGENT_READINESS_GAUGE_SIZE = 120;
export const AGENT_READINESS_GAUGE_STROKE = 8;
export const AGENT_READINESS_GAUGE_RADIUS =
  (AGENT_READINESS_GAUGE_SIZE - AGENT_READINESS_GAUGE_STROKE) / 2;
export const AGENT_READINESS_GAUGE_CIRCUMFERENCE =
  2 * Math.PI * AGENT_READINESS_GAUGE_RADIUS;
export const AGENT_READINESS_SCANNING_GAUGE_ARC =
  AGENT_READINESS_GAUGE_CIRCUMFERENCE * 0.28;

export const AGENT_READINESS_CHECKLIST_PLACEHOLDER_KEYS = [
  "scanning-check-1",
  "scanning-check-2",
  "scanning-check-3",
] as const;

export const AGENT_READINESS_SKELETON_ROW_KEYS = Array.from(
  { length: 3 },
  (_, index) => `checklist-row-${index}`
);

export const AGENT_READINESS_BAND_TEXT_CLASS = {
  great: "text-emerald-500",
  "needs-improvement": "text-amber-500",
  poor: "text-red-500",
} as const;
