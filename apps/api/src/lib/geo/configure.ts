import {
  allowUnmeteredAiInDevelopment,
  autumn,
} from "@notra/ai/billing/autumn";
import { FEATURES } from "@notra/ai/billing/features";
import {
  GeoEntitlementService,
  GeoFeatureFlagService,
  GeoGenerationService,
  GeoWorkflowService,
} from "@notra/geo-core/deps";
import { Redis } from "@upstash/redis";
import { Effect, Layer } from "effect";

import {
  AGENT_READINESS_INTERNAL_WORKFLOW_PATH,
  GEO_SCAN_INTERNAL_WORKFLOW_PATH,
  GEO_WRITER_INTERNAL_WORKFLOW_PATH,
} from "../../constants/geo";
import { addActiveGeneration } from "../../utils/active-generations";
import {
  getInternalWorkflowUrl,
  startDashboardWorkflow,
} from "../../utils/internal-workflow";

const redis = Redis.fromEnv();

function requireInternalWorkflowUrl(path: string): string {
  const url = getInternalWorkflowUrl(process.env, path);
  if (!url) {
    throw new Error(
      "WORKFLOW_BASE_URL is not configured — cannot reach the dashboard."
    );
  }
  return url;
}

const workflowLayer = Layer.succeed(GeoWorkflowService, {
  startGeoScanRun: Effect.fn("GeoApiWorkflow.startGeoScanRun")(
    function* (payload) {
      const runId = yield* Effect.tryPromise({
        try: () =>
          startDashboardWorkflow(
            requireInternalWorkflowUrl(GEO_SCAN_INTERNAL_WORKFLOW_PATH),
            payload
          ),
        catch: (cause) => cause,
      });
      return { runId };
    }
  ),
  startGeoWriterRun: Effect.fn("GeoApiWorkflow.startGeoWriterRun")(
    function* (payload) {
      const runId = yield* Effect.tryPromise({
        try: () =>
          startDashboardWorkflow(
            requireInternalWorkflowUrl(GEO_WRITER_INTERNAL_WORKFLOW_PATH),
            payload
          ),
        catch: (cause) => cause,
      });
      return { runId };
    }
  ),
  startAgentReadinessRun: Effect.fn("GeoApiWorkflow.startAgentReadinessRun")(
    function* (payload) {
      const runId = yield* Effect.tryPromise({
        try: () =>
          startDashboardWorkflow(
            requireInternalWorkflowUrl(AGENT_READINESS_INTERNAL_WORKFLOW_PATH),
            payload
          ),
        catch: (cause) => cause,
      });
      return { runId };
    }
  ),
});

const entitlementLayer = Layer.succeed(GeoEntitlementService, {
  hasZdrEntitlement: Effect.fn("GeoApiEntitlement.hasZdr")(
    function* (organizationId) {
      if (allowUnmeteredAiInDevelopment) {
        return true;
      }
      const client = autumn;
      if (!client) {
        return process.env.NODE_ENV !== "production";
      }
      return yield* Effect.promise(async () => {
        try {
          const data = await client.check({
            customerId: organizationId,
            featureId: FEATURES.ZDR,
          });
          return data.allowed === true;
        } catch {
          return false;
        }
      });
    }
  ),
});

const featureFlagLayer = Layer.succeed(GeoFeatureFlagService, {
  // The API has no feature-flag client. Hidden engines are preserved when
  // settings are saved, so reporting Cursor as disabled cannot remove access.
  isCursorEngineEnabledForOrganization: Effect.fn(
    "GeoApiFeatureFlags.isCursorEnabled"
  )(() => Effect.succeed(false)),
});

const generationLayer = Layer.succeed(GeoGenerationService, {
  addActiveGeneration: Effect.fn("GeoApiGeneration.addActive")(
    (organizationId, generation) =>
      Effect.tryPromise({
        try: () => addActiveGeneration(redis, organizationId, generation),
        catch: (cause) => cause,
      })
  ),
  generateRunId: Effect.fn("GeoApiGeneration.generateRunId")((triggerId) =>
    Effect.sync(() => `${triggerId}-${Date.now()}`)
  ),
});

/**
 * Capabilities the public API can truthfully provide to GEO programs.
 *
 * Content billing is deliberately absent. Programs that require it run in the
 * dashboard and are reached through its authenticated internal endpoints.
 */
export const geoCoreApiLayer = Layer.mergeAll(
  workflowLayer,
  entitlementLayer,
  featureFlagLayer,
  generationLayer
);
