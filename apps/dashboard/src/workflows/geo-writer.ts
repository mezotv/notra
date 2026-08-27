import { GEO_WRITER_MODEL } from "@notra/ai/constants/models";
import { flattenError } from "zod";

import { GEO_WRITER_TRIGGER_ID } from "@/constants/geo";
import { geoWriterWorkflowPayloadSchema } from "@/schemas/geo";
import type { GeoWriterContext, GeoWriterWorkflowResult } from "@/types/geo";

import {
  appendAutomationLog,
  claimWorkflowExecution,
  finalizeAiCredit,
  gateAndReserveAiCredits,
} from "./steps/content-generation-steps";
import {
  failGeoWriter,
  finishGeoWriter,
  loadGeoWriterContext,
  runGeoWriterStep,
} from "./steps/geo-writer-steps";
import { reconcileCollectionAttempt } from "./steps/on-demand-steps";

const LOG_PREFIX = "GeoWriter";

function describeFailure(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return "Unexpected writer error";
}

export async function geoWriterWorkflow(
  payload: unknown
): Promise<GeoWriterWorkflowResult> {
  "use workflow";

  const parseResult = geoWriterWorkflowPayloadSchema.safeParse(payload);
  if (!parseResult.success) {
    console.error(
      `[${LOG_PREFIX}] Invalid payload:`,
      flattenError(parseResult.error)
    );
    return { status: "invalid_payload" };
  }
  const { organizationId, briefId, runId } = parseResult.data;

  let context: GeoWriterContext | null = null;
  let creditLockId: string | null = null;
  try {
    const claimToken = crypto.randomUUID();
    const claim = await claimWorkflowExecution({
      executionId: runId,
      claimToken,
    });
    if (!claim.claimed) {
      console.warn(
        `[${LOG_PREFIX}] Duplicate execution ${runId} for org ${organizationId}, skipping`
      );
      return { status: "duplicate_execution" };
    }

    context = await loadGeoWriterContext({ organizationId, briefId, runId });
    if (!context) {
      console.warn(
        `[${LOG_PREFIX}] Brief ${briefId} is not ready for writing, skipping`
      );
      return { status: "invalid_state" };
    }

    const gate = await gateAndReserveAiCredits({
      organizationId,
      executionId: runId,
    });
    if (!gate.allowed) {
      await failGeoWriter({
        organizationId,
        briefId,
        runId,
        reason: "AI credit limit reached",
      });
      await reconcileCollectionAttempt({
        collectionId: context.collectionId,
        organizationId,
        runId,
      });
      return { status: "credits_exhausted" };
    }
    creditLockId = gate.lockId;

    const result = await runGeoWriterStep(context, runId);

    await finishGeoWriter({
      organizationId,
      briefId,
      runId,
      postId: result.postId,
      title: result.title,
      humanized: result.humanized,
    });

    try {
      await finalizeAiCredit({
        lockId: creditLockId,
        action: "confirm",
        usage: result.usage,
        fallbackModelId: GEO_WRITER_MODEL,
        useMarkup: gate.useMarkup,
        properties: {
          source: "geo_writer",
          output_type: "blog_post",
          trigger_id: GEO_WRITER_TRIGGER_ID,
          run_id: runId,
          markup_applied: gate.useMarkup,
        },
        logPrefix: LOG_PREFIX,
      });
      await appendAutomationLog({
        organizationId,
        integrationId: GEO_WRITER_TRIGGER_ID,
        integrationType: "manual",
        title: `GEO writer created "${result.title}"`,
        status: "success",
        referenceId: result.postId,
      });
    } catch (postSuccessError) {
      console.error(
        `[${LOG_PREFIX}] Post-success effects failed for run ${runId}; content remains created`,
        postSuccessError
      );
    }

    return {
      status: "success",
      postId: result.postId,
      humanized: result.humanized,
    };
  } catch (error) {
    const reason = describeFailure(error);
    console.error(`[${LOG_PREFIX}] Run ${runId} failed:`, error);
    const cleanup = [
      failGeoWriter({ organizationId, briefId, runId, reason }),
      finalizeAiCredit({
        lockId: creditLockId,
        action: "release",
        logPrefix: LOG_PREFIX,
      }),
      appendAutomationLog({
        organizationId,
        integrationId: GEO_WRITER_TRIGGER_ID,
        integrationType: "manual",
        title: "GEO writer failed",
        status: "failed",
        errorMessage: reason,
      }),
    ];
    if (context) {
      cleanup.push(
        reconcileCollectionAttempt({
          collectionId: context.collectionId,
          organizationId,
          runId,
        })
      );
    }
    const cleanupResults = await Promise.allSettled(cleanup);
    for (const cleanupResult of cleanupResults) {
      if (cleanupResult.status === "rejected") {
        console.error(
          `[${LOG_PREFIX}] Failure cleanup failed for run ${runId}:`,
          cleanupResult.reason
        );
      }
    }
    return { status: "failed", reason };
  }
}
