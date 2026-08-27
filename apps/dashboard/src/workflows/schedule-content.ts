import { sleep } from "workflow";
import { flattenError } from "zod";

import {
  GITHUB_RATE_LIMIT_RETRY_DELAY,
  SCHEDULE_AI_CREDIT_LOCK_TTL_MS,
  SCHEDULE_RATE_LIMIT_MAX_ATTEMPTS,
} from "@/constants/workflows";
import type { ContentGenerationResult } from "@/lib/workflows/schedule/types";
import { scheduleWorkflowPayloadSchema } from "@/schemas/workflows";
import type { WorkflowAiCreditGate } from "@/types/workflows/content-generation-steps";
import type { ScheduleContentWorkflowResult } from "@/types/workflows/schedule-generation";

import {
  appendAutomationLog,
  claimWorkflowExecution,
  cleanupEmptyCollection,
  clearWorkflowPause,
  createGenerationCollection,
  enqueueDigest,
  fetchBrandSettingsData,
  fetchGenerationUserId,
  fetchNotificationData,
  fetchScheduleSources,
  fetchScheduleTriggerContext,
  finalizeAiCredit,
  finishGeneration,
  gateAndReserveAiCredits,
  notifyAiCreditsDepleted,
  recordWorkflowPause,
  startGenerationTracking,
  trackContentOutcome,
} from "./steps/content-generation-steps";
import { runScheduledGeneration } from "./steps/schedule-generation-step";

const LOG_PREFIX = "Schedule";

export async function scheduleContentWorkflow(payload: {
  triggerId: string;
  manual?: boolean;
  executionId?: string;
  delaySeconds?: number;
}): Promise<ScheduleContentWorkflowResult> {
  "use workflow";

  const parseResult = scheduleWorkflowPayloadSchema.safeParse(payload);
  if (!parseResult.success) {
    console.error(
      "[Schedule] Invalid payload:",
      flattenError(parseResult.error)
    );
    return { status: "invalid_payload" };
  }
  const { triggerId, manual, executionId, delaySeconds } = parseResult.data;
  const creationMode = manual ? "manual" : "automatic";
  const resolvedExecutionId = executionId ?? crypto.randomUUID();
  const claimToken = crypto.randomUUID();

  if (delaySeconds && delaySeconds > 0) {
    await sleep(delaySeconds * 1000);
  }

  const claim = await claimWorkflowExecution({
    executionId: resolvedExecutionId,
    claimToken,
  });
  if (!claim.claimed) {
    console.warn(
      `[Schedule] Duplicate execution ${resolvedExecutionId} for trigger ${triggerId}, skipping`
    );
    return { status: "duplicate_execution" };
  }

  const { trigger, lookbackWindow } =
    await fetchScheduleTriggerContext(triggerId);
  if (!trigger) {
    console.log(`[Schedule] Trigger ${triggerId} not found, canceling`);
    return { status: "trigger_not_found" };
  }
  if (!trigger.enabled) {
    console.log(`[Schedule] Trigger ${triggerId} is disabled, canceling`);
    return { status: "trigger_disabled" };
  }
  const automationName = trigger.name.trim() || trigger.outputType;

  const gate = await gateAndReserveAiCredits({
    organizationId: trigger.organizationId,
    executionId: resolvedExecutionId,
    lockTtlMs: SCHEDULE_AI_CREDIT_LOCK_TTL_MS,
  });
  if (!gate.allowed) {
    if (gate.shouldNotify) {
      await notifyAiCreditsDepleted({
        organizationId: trigger.organizationId,
        automationName,
        logPrefix: LOG_PREFIX,
      });
      if (!manual) {
        await recordWorkflowPause({
          triggerId,
          organizationId: trigger.organizationId,
          automationName,
          reason: "ai_credits_depleted",
          logPrefix: LOG_PREFIX,
        });
      }
    }
    return { status: "credits_exhausted" };
  }

  let sources: Awaited<ReturnType<typeof fetchScheduleSources>>;
  let brand: Awaited<ReturnType<typeof fetchBrandSettingsData>>;
  let generationUserId: Awaited<ReturnType<typeof fetchGenerationUserId>>;
  try {
    [sources, brand, generationUserId] = await Promise.all([
      fetchScheduleSources({
        organizationId: trigger.organizationId,
        repositoryIds: trigger.targets.repositoryIds,
      }),
      fetchBrandSettingsData({
        organizationId: trigger.organizationId,
        outputConfig: trigger.outputConfig,
      }),
      fetchGenerationUserId(trigger.organizationId),
    ]);
  } catch (error) {
    await finalizeAiCredit({
      lockId: gate.lockId,
      action: "release",
      logPrefix: LOG_PREFIX,
    });
    throw error;
  }
  const { repositories, linearIntegrationRefs } = sources;

  if (repositories.length === 0 && linearIntegrationRefs.length === 0) {
    console.log(
      `[Schedule] No valid data sources for trigger ${triggerId}, canceling`
    );
    await finalizeAiCredit({
      lockId: gate.lockId,
      action: "release",
      logPrefix: LOG_PREFIX,
    });
    return { status: "no_sources" };
  }

  const runId = `${triggerId}-${Date.now()}`;
  const collectionId = `group_${runId}`;

  try {
    await startGenerationTracking({
      organizationId: trigger.organizationId,
      runId,
      triggerId: trigger.id,
      outputType: trigger.outputType,
      triggerName: trigger.name.trim() || trigger.outputType,
    });
    await createGenerationCollection({
      collectionId,
      organizationId: trigger.organizationId,
      source: trigger.sourceType === "cron" ? "schedule" : "automation",
      sourceId: runId,
      outputType: trigger.outputType,
      sourceMetadata: {
        triggerId: trigger.id,
        triggerName: trigger.name,
        triggerSourceType: trigger.sourceType,
        manualRun: manual,
      },
    });

    let contentResult: ContentGenerationResult | null = null;
    for (
      let attempt = 1;
      attempt <= SCHEDULE_RATE_LIMIT_MAX_ATTEMPTS;
      attempt++
    ) {
      contentResult = await runScheduledGeneration({
        trigger,
        lookbackWindow,
        repositories,
        linearIntegrationRefs,
        brand,
        collectionId,
        generationUserId,
        manual,
      });
      if (contentResult.status !== "rate_limited") {
        break;
      }
      if (attempt < SCHEDULE_RATE_LIMIT_MAX_ATTEMPTS) {
        console.warn(
          `[Schedule] GitHub API rate limit hit for trigger ${triggerId}. Retrying after ${GITHUB_RATE_LIMIT_RETRY_DELAY} (attempt ${attempt}).`
        );
        await sleep(GITHUB_RATE_LIMIT_RETRY_DELAY);
      }
    }
    if (!contentResult) {
      throw new Error("Content generation produced no result");
    }

    if (contentResult.status === "rate_limited") {
      await finishGeneration({
        organizationId: trigger.organizationId,
        runId,
        triggerId,
        outputType: trigger.outputType,
        triggerName: automationName,
        status: "failed",
        reason: "GitHub API rate limit hit repeatedly",
      });
      await finalizeAiCredit({
        lockId: gate.lockId,
        action: "release",
        logPrefix: LOG_PREFIX,
      });
      await cleanupEmptyCollection({
        collectionId,
        organizationId: trigger.organizationId,
      });
      return { status: "rate_limited_exhausted" };
    }

    if (contentResult.status === "unsupported_output_type") {
      await finishGeneration({
        organizationId: trigger.organizationId,
        runId,
        triggerId,
        outputType: trigger.outputType,
        triggerName: automationName,
        status: "failed",
        reason: "Unsupported output type",
      });
      await finalizeAiCredit({
        lockId: gate.lockId,
        action: "release",
        logPrefix: LOG_PREFIX,
      });
      if (!manual) {
        await recordWorkflowPause({
          triggerId,
          organizationId: trigger.organizationId,
          automationName,
          reason: "workflow_errors",
          logPrefix: LOG_PREFIX,
        });
      }
      await cleanupEmptyCollection({
        collectionId,
        organizationId: trigger.organizationId,
      });
      return { status: "unsupported_output_type" };
    }

    if (contentResult.status === "generation_failed") {
      await finalizeAiCredit({
        lockId: gate.lockId,
        action: "release",
        logPrefix: LOG_PREFIX,
      });
      await finishGeneration({
        organizationId: trigger.organizationId,
        runId,
        triggerId,
        outputType: trigger.outputType,
        triggerName: automationName,
        status: "failed",
        reason: contentResult.reason,
      });
      await appendAutomationLog({
        organizationId: trigger.organizationId,
        integrationId: triggerId,
        integrationType: manual ? "manual" : "schedule",
        title: `Schedule "${automationName}" failed to generate content`,
        status: "failed",
        errorMessage: contentResult.reason,
      });
      await trackContentOutcome({
        kind: "failed",
        triggerId: trigger.id,
        organizationId: trigger.organizationId,
        outputType: trigger.outputType,
        creationMode,
        reason: contentResult.reason,
        lookbackWindow,
        repositoryCount: repositories.length,
        source: "schedule",
        logPrefix: LOG_PREFIX,
      });
      const failureNotificationData = await fetchNotificationData({
        organizationId: trigger.organizationId,
        setting: "scheduledContentFailed",
      });
      if (
        failureNotificationData.enabled &&
        failureNotificationData.ownerEmails.length > 0
      ) {
        await enqueueDigest({
          organizationId: trigger.organizationId,
          recipientEmails: failureNotificationData.ownerEmails,
          kind: "scheduled_content_failed",
          event: {
            organizationName: failureNotificationData.organizationName,
            organizationSlug: failureNotificationData.organizationSlug,
            scheduleName: automationName,
            reason: contentResult.reason,
          },
          logPrefix: LOG_PREFIX,
        });
      }
      if (!manual) {
        await recordWorkflowPause({
          triggerId,
          organizationId: trigger.organizationId,
          automationName,
          reason: "workflow_errors",
          logPrefix: LOG_PREFIX,
        });
      }
      await cleanupEmptyCollection({
        collectionId,
        organizationId: trigger.organizationId,
      });
      return { status: "generation_failed", reason: contentResult.reason };
    }

    if (contentResult.status === "skipped") {
      await finalizeAiCredit({
        lockId: gate.lockId,
        action: "release",
        logPrefix: LOG_PREFIX,
      });
      await finishGeneration({
        organizationId: trigger.organizationId,
        runId,
        triggerId,
        outputType: trigger.outputType,
        triggerName: automationName,
        status: "skipped",
        reason: contentResult.reason,
      });
      await appendAutomationLog({
        organizationId: trigger.organizationId,
        integrationId: triggerId,
        integrationType: manual ? "manual" : "schedule",
        title: `Schedule "${automationName}" skipped content generation`,
        status: "skipped",
        errorMessage: contentResult.reason,
      });
      await trackContentOutcome({
        kind: "skipped",
        triggerId: trigger.id,
        organizationId: trigger.organizationId,
        outputType: trigger.outputType,
        creationMode,
        reason: contentResult.reason,
        lookbackWindow,
        repositoryCount: repositories.length,
        source: "schedule",
        logPrefix: LOG_PREFIX,
      });
      const skippedNotificationData = await fetchNotificationData({
        organizationId: trigger.organizationId,
        setting: "scheduledContentSkipped",
      });
      if (
        skippedNotificationData.enabled &&
        skippedNotificationData.ownerEmails.length > 0
      ) {
        await enqueueDigest({
          organizationId: trigger.organizationId,
          recipientEmails: skippedNotificationData.ownerEmails,
          kind: "scheduled_content_skipped",
          event: {
            organizationName: skippedNotificationData.organizationName,
            organizationSlug: skippedNotificationData.organizationSlug,
            scheduleName: automationName,
            reason: contentResult.reason,
          },
          logPrefix: LOG_PREFIX,
        });
      }
      await cleanupEmptyCollection({
        collectionId,
        organizationId: trigger.organizationId,
      });
      if (!manual) {
        await clearWorkflowPause({ triggerId, logPrefix: LOG_PREFIX });
      }
      return { status: "skipped", reason: contentResult.reason };
    }

    const createdPosts = contentResult.posts;
    const [primaryPost] = createdPosts;

    if (!primaryPost) {
      console.warn("[Schedule] Content generation returned no posts", {
        triggerId,
      });
      await finishGeneration({
        organizationId: trigger.organizationId,
        runId,
        triggerId,
        outputType: trigger.outputType,
        triggerName: automationName,
        status: "failed",
        reason: "Content generation returned no posts",
      });
      await finalizeAiCredit({
        lockId: gate.lockId,
        action: "release",
        logPrefix: LOG_PREFIX,
      });
      if (!manual) {
        await recordWorkflowPause({
          triggerId,
          organizationId: trigger.organizationId,
          automationName,
          reason: "workflow_errors",
          logPrefix: LOG_PREFIX,
        });
      }
      await cleanupEmptyCollection({
        collectionId,
        organizationId: trigger.organizationId,
      });
      return { status: "empty_result" };
    }

    const postId = primaryPost.postId;
    const contentTitle =
      createdPosts.length === 1
        ? primaryPost.title
        : `${createdPosts.length} ${trigger.outputType.replaceAll("_", " ")} drafts`;

    await finishGeneration({
      organizationId: trigger.organizationId,
      runId,
      triggerId,
      outputType: trigger.outputType,
      triggerName: automationName,
      status: "success",
      title: contentTitle,
    });

    await finalizeAiCredit({
      lockId: gate.lockId,
      action: "confirm",
      usage: contentResult.usage,
      fallbackModelId: "anthropic/claude-sonnet-4.6",
      useMarkup: gate.useMarkup,
      properties: buildCreditProperties(
        gate,
        trigger.outputType,
        automationName,
        triggerId,
        runId
      ),
      logPrefix: LOG_PREFIX,
    });

    try {
      await appendAutomationLog({
        organizationId: trigger.organizationId,
        integrationId: triggerId,
        integrationType: manual ? "manual" : "schedule",
        title:
          createdPosts.length === 1
            ? `Schedule "${automationName}" created "${contentTitle}"`
            : `Schedule "${automationName}" created ${createdPosts.length} drafts`,
        status: "success",
        referenceId: postId,
      });
      await trackContentOutcome({
        kind: "created",
        triggerId: trigger.id,
        organizationId: trigger.organizationId,
        outputType: trigger.outputType,
        creationMode,
        lookbackWindow,
        repositoryCount: repositories.length,
        source: "schedule",
        postIds: createdPosts.map((createdPost) => createdPost.postId),
        logPrefix: LOG_PREFIX,
      });
      const notificationData = await fetchNotificationData({
        organizationId: trigger.organizationId,
        setting: "scheduledContentCreation",
      });
      if (notificationData.enabled && notificationData.ownerEmails.length > 0) {
        const baseUrl = process.env.APP_URL ?? "https://app.usenotra.com";
        const contentOverviewLink = `${baseUrl}/${notificationData.organizationSlug}/content`;
        await enqueueDigest({
          organizationId: trigger.organizationId,
          recipientEmails: notificationData.ownerEmails,
          kind: "scheduled_content_created",
          event: {
            organizationName: notificationData.organizationName,
            organizationSlug: notificationData.organizationSlug,
            scheduleName: automationName,
            createdContent: createdPosts.map((createdPost) => ({
              title: createdPost.title,
              contentLink: `${contentOverviewLink}/${createdPost.postId}`,
            })),
            contentType: trigger.outputType,
            contentOverviewLink,
            subject: manual
              ? `New content created from ${automationName}`
              : `Your ${automationName} schedule created new content`,
          },
          logPrefix: LOG_PREFIX,
        });
      }
      if (!manual) {
        await clearWorkflowPause({ triggerId, logPrefix: LOG_PREFIX });
      }
    } catch (postSuccessError) {
      console.error(
        `[Schedule] Post-success effects failed for trigger ${triggerId}; content remains created`,
        postSuccessError
      );
    }

    return { status: "success", triggerId, postId };
  } catch (error) {
    await finishGeneration({
      organizationId: trigger.organizationId,
      runId,
      triggerId,
      outputType: trigger.outputType,
      triggerName: automationName,
      status: "failed",
      reason: "Unexpected workflow error",
    });
    await finalizeAiCredit({
      lockId: gate.lockId,
      action: "release",
      logPrefix: LOG_PREFIX,
    });
    await cleanupEmptyCollection({
      collectionId,
      organizationId: trigger.organizationId,
    });
    if (!manual) {
      await recordWorkflowPause({
        triggerId,
        organizationId: trigger.organizationId,
        automationName,
        reason: "workflow_errors",
        logPrefix: LOG_PREFIX,
      });
    }
    throw error;
  }
}

function buildCreditProperties(
  gate: WorkflowAiCreditGate,
  outputType: string,
  triggerName: string,
  triggerId: string,
  runId: string
): Record<string, string | number | boolean> {
  return {
    source: "workflow_schedule",
    output_type: outputType,
    trigger_name: triggerName,
    trigger_id: triggerId,
    run_id: runId,
    markup_applied: gate.useMarkup,
  };
}
