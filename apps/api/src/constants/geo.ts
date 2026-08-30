/** Internal dashboard route that starts the GEO scan workflow. */
export const GEO_SCAN_INTERNAL_WORKFLOW_PATH =
  "/api/internal/workflows/geo-scan";

/** Internal dashboard route that executes one prompt sequence. */
export const GEO_SEQUENCE_RUN_INTERNAL_PATH = "/api/internal/geo/sequence-run";

/** Internal dashboard route that approves a brief and starts the writer workflow. */
export const GEO_WRITER_INTERNAL_WORKFLOW_PATH =
  "/api/internal/workflows/geo-writer";

/** Internal dashboard route that plans a content brief (AI call + billing gate). */
export const GEO_WRITER_PLAN_INTERNAL_PATH = "/api/internal/geo/writer-plan";

/** Internal dashboard route that starts an agent readiness scan behind its flag. */
export const AGENT_READINESS_INTERNAL_WORKFLOW_PATH =
  "/api/internal/workflows/agent-readiness";

/**
 * Kept byte-identical to the dashboard's `GEO_PLAN_REQUIRED_MESSAGE` so a
 * client sees the same 402 copy whichever surface it hit.
 */
export const GEO_PLAN_REQUIRED_MESSAGE =
  "GEO requires a Starter, Growth, or Scale plan";

export const GEO_PROJECT_NOT_FOUND_ERROR = "Project not found";

export const ORGANIZATION_SCOPED_API_KEY_ERROR =
  "Forbidden: API key must be scoped to an organization";
