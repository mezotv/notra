/** Public Is Agentic API (Vercel Labs); no API key required. */
export const AGENT_READINESS_API_ORIGIN = "https://is-agentic.com";
export const AGENT_READINESS_FLAG_KEY = "agent-readiness";
export const AGENT_READINESS_UNAVAILABLE_DESCRIPTION =
  "Agent Readiness is not available for this organization.";
/** Scans usually finish in 1-3 minutes; abort well past that. */
export const AGENT_READINESS_SCAN_TIMEOUT_MS = 8 * 60 * 1000;
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
