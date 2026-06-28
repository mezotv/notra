import { calculateAiCreditCostCents } from "@notra/ai/billing/ai-credit-cost";
import { autumn } from "@notra/ai/billing/autumn";
import { FEATURES } from "@notra/ai/billing/features";
import { getGitHubToolRepositoryContextByIntegrationId } from "@notra/ai/integrations/github";
import { getBaseUrl } from "@notra/ai/qstash/triggers";
import { getValidToneProfile } from "@notra/ai/schemas/tone";
import { db } from "@notra/db/drizzle";
import type { PostSourceMetadata } from "@notra/db/schema";
import {
  brandSettings,
  contentTriggerLookbackWindows,
  contentTriggers,
  githubIntegrations,
  members,
  organizationNotificationSettings,
  organizations,
  postCollections,
} from "@notra/db/schema";
import { buildPostCollectionName } from "@notra/db/utils/post-collections";
import type { WorkflowContext } from "@upstash/workflow";
import { WorkflowAbort } from "@upstash/workflow";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";
import { checkLogRetention } from "@/lib/billing/check-log-retention";
import { checkWorkflowAiCredits } from "@/lib/billing/workflow-ai-credits";
import {
  trackScheduledContentCreated,
  trackScheduledContentFailed,
  trackScheduledContentSkipped,
} from "@/lib/databuddy";
import {
  addActiveGeneration,
  completeActiveGeneration,
  generateRunId,
} from "@/lib/generations/tracking";
import { appendWebhookLog } from "@/lib/webhooks/logging";
import { generateEventBasedContent } from "@/lib/workflows/event/handlers";
import { sendAiCreditsDepletedEmails } from "@/lib/workflows/shared/ai-credit-notifications";
import {
  clearAutomatedWorkflowPauseStateStep,
  recordAutomatedWorkflowPauseStep,
} from "@/lib/workflows/shared/auto-pause";
import { enqueueContentEmailDigest } from "@/lib/workflows/shared/content-email-digest-enqueue";
import {
  parseLookbackWindow,
  parseTriggerOutputConfig,
} from "@/lib/workflows/shared/parsing";
import type { LookbackWindow } from "@/schemas/integrations";
import {
  type EventWorkflowPayload,
  eventWorkflowPayloadSchema,
} from "@/schemas/workflows";
import type { LogRetentionDays } from "@/types/webhooks/webhooks";
import type {
  EventGenerationResult,
  WorkflowBrandSettings,
  WorkflowRepositoryData,
  WorkflowTriggerData,
} from "@/types/workflows/workflows";

export const { POST } = serve<EventWorkflowPayload>(
  async (context: WorkflowContext<EventWorkflowPayload>) => {
    const parseResult = eventWorkflowPayloadSchema.safeParse(
      context.requestPayload
    );
    if (!parseResult.success) {
      console.error("[Event] Invalid payload:", parseResult.error.flatten());
      await context.cancel();
      return;
    }

    const { triggerId, eventType, eventAction, eventData, repositoryId } =
      parseResult.data;
    const manual = eventData.manualRun === true;

    const trigger = await context.run<WorkflowTriggerData | null>(
      "fetch-trigger",
      async () => {
        const result = await db.query.contentTriggers.findFirst({
          where: eq(contentTriggers.id, triggerId),
        });

        if (!result) {
          return null;
        }

        return {
          id: result.id,
          name: result.name,
          organizationId: result.organizationId,
          outputType: result.outputType,
          outputConfig: result.outputConfig,
          enabled: result.enabled,
          autoPublish: result.autoPublish,
        };
      }
    );

    if (!trigger) {
      console.log(`[Event] Trigger ${triggerId} not found, canceling`);
      await context.cancel();
      return;
    }

    if (!trigger.enabled) {
      console.log(`[Event] Trigger ${triggerId} is disabled, canceling`);
      await context.cancel();
      return;
    }

    const aiCreditReservation = await context.run(
      "check-ai-credit-balance",
      async () => checkWorkflowAiCredits(trigger.organizationId)
    );

    if (!aiCreditReservation.allowed) {
      if (aiCreditReservation.reason === "no_active_paid_plan") {
        console.warn(
          `[Event] No active paid plan for org ${trigger.organizationId}, canceling trigger ${triggerId} without notification`
        );
      }

      if (aiCreditReservation.shouldNotify) {
        await context.run("send-ai-credits-depleted-emails", () =>
          sendAiCreditsDepletedEmails({
            organizationId: trigger.organizationId,
            automationName: trigger.name.trim() || `${eventType} event`,
            logPrefix: "Event",
          })
        );

        console.warn(
          `[Event] AI credits depleted for paid org ${trigger.organizationId}, canceling trigger ${triggerId}`,
          { balanceRemaining: aiCreditReservation.balanceRemaining }
        );

        await recordAutomatedWorkflowPauseStep(context, {
          manual,
          stepName: "record-ai-credit-depleted-pause",
          triggerId,
          organizationId: trigger.organizationId,
          automationName: trigger.name.trim() || `${eventType} event`,
          reason: "ai_credits_depleted",
          logPrefix: "Event",
        });
      }

      await context.cancel();
      return;
    }

    const lookbackWindow = await context.run<LookbackWindow>(
      "fetch-lookback-window",
      async () => {
        const lookbackResult =
          await db.query.contentTriggerLookbackWindows.findFirst({
            where: eq(contentTriggerLookbackWindows.triggerId, triggerId),
          });

        return parseLookbackWindow(lookbackResult?.window);
      }
    );

    const repository = await context.run<WorkflowRepositoryData | null>(
      "fetch-repository",
      async () => {
        const repo = await db.query.githubIntegrations.findFirst({
          where: and(
            eq(githubIntegrations.id, repositoryId),
            eq(githubIntegrations.organizationId, trigger.organizationId)
          ),
        });

        if (!repo) {
          return null;
        }

        if (!(repo.owner && repo.repo)) {
          return null;
        }

        return {
          id: repo.id,
          owner: repo.owner,
          name: repo.repo,
        };
      }
    );

    if (!repository) {
      console.log(
        `[Event] Repository ${repositoryId} not found for trigger ${triggerId}, canceling`
      );
      await context.cancel();
      return;
    }

    const brand = await context.run<WorkflowBrandSettings | null>(
      "fetch-brand-settings",
      async () => {
        const outputConfig = parseTriggerOutputConfig(trigger.outputConfig);
        const voiceId = outputConfig?.brandVoiceId;

        let result = voiceId
          ? await db.query.brandSettings.findFirst({
              where: and(
                eq(brandSettings.id, voiceId),
                eq(brandSettings.organizationId, trigger.organizationId)
              ),
            })
          : null;

        if (!result) {
          result = await db.query.brandSettings.findFirst({
            where: and(
              eq(brandSettings.organizationId, trigger.organizationId),
              eq(brandSettings.isDefault, true)
            ),
          });
        }

        if (!result) {
          return null;
        }

        return {
          id: result.id,
          name: result.name,
          toneProfile: result.toneProfile,
          companyName: result.companyName,
          companyDescription: result.companyDescription,
          audience: result.audience,
          customInstructions: result.customInstructions,
          language: result.language,
        };
      }
    );

    const logRetentionDays = await context.run<LogRetentionDays>(
      "fetch-retention",
      async () => checkLogRetention(trigger.organizationId)
    );

    const runId = await context.run("generate-run-id", () =>
      generateRunId(triggerId)
    );

    const collectionId = `group_${runId}`;

    await context.run("track-generation-start", async () => {
      await addActiveGeneration(trigger.organizationId, {
        runId,
        triggerId: trigger.id,
        outputType: trigger.outputType,
        triggerName: trigger.name.trim() || `${eventType} event`,
        startedAt: new Date().toISOString(),
      });
    });

    await context.run("create-post-collection", async () => {
      const now = new Date();

      await db.insert(postCollections).values({
        id: collectionId,
        organizationId: trigger.organizationId,
        source: "automation",
        sourceId: runId,
        name: buildPostCollectionName([trigger.outputType], now),
        nameSource: "generated",
        contentTypes: [trigger.outputType],
        sourceMetadata: {
          triggerId: trigger.id,
          triggerName: trigger.name,
          triggerSourceType: "github_webhook",
          eventType,
          eventAction,
        },
        expectedPostCount: 1,
        completedPostCount: 0,
        createdAt: now,
        updatedAt: now,
      });
    });

    try {
      const sourceMetadata: PostSourceMetadata = {
        triggerId: trigger.id,
        triggerSourceType: "github_webhook",
        eventType,
        eventAction,
        repositories: [{ owner: repository.owner, repo: repository.name }],
        brandVoiceName: brand?.name,
        brandVoiceId: brand?.id,
      };

      const tone = getValidToneProfile(brand?.toneProfile, "Conversational");

      const contentResult = await context.run<EventGenerationResult>(
        "generate-content",
        async () => {
          return generateEventBasedContent({
            organizationId: trigger.organizationId,
            collectionId,
            triggerId: trigger.id,
            triggerName: trigger.name,
            eventType,
            eventAction,
            eventData,
            repositoryId: repository.id,
            repositoryOwner: repository.owner,
            repositoryName: repository.name,
            outputType: trigger.outputType,
            tone,
            brand: {
              companyName: brand?.companyName ?? undefined,
              companyDescription: brand?.companyDescription ?? undefined,
              audience: brand?.audience ?? undefined,
              customInstructions: brand?.customInstructions ?? null,
            },
            sourceMetadata,
            autoPublish: trigger.autoPublish,
            resolveContext: getGitHubToolRepositoryContextByIntegrationId,
            telemetryMetadata: {
              contentType: trigger.outputType,
              eventAction,
              eventType,
              feature: "content_generation",
              generationMode: "event",
              organizationId: trigger.organizationId,
              repositoryId: repository.id,
              routeName: "/api/workflows/event",
              triggerId: trigger.id,
              triggerName: trigger.name,
              triggerSourceType: "github_webhook",
              voiceId: brand?.id,
            },
          });
        }
      );

      if (contentResult.status === "unsupported_output_type") {
        await context.run("track-generation-end-unsupported", async () => {
          await completeActiveGeneration(trigger.organizationId, {
            runId,
            triggerId,
            outputType: trigger.outputType,
            triggerName: trigger.name.trim() || `${eventType} event`,
            status: "failed",
            reason: "Unsupported output type",
            completedAt: new Date().toISOString(),
          });
        });

        const autumnClient = autumn;
        if (aiCreditReservation.reserved && autumnClient) {
          await context.run("refund-ai-credit-unsupported", async () => {
            try {
              await autumnClient.track({
                customerId: trigger.organizationId,
                featureId: FEATURES.AI_CREDITS,
                value: 0,
                properties: {
                  source: "workflow_event",
                  output_type: trigger.outputType,
                  trigger_name: trigger.name.trim() || `${eventType} event`,
                  trigger_id: triggerId,
                  run_id: runId,
                  event_type: eventType,
                  refund_reason: "unsupported_output_type",
                },
              });
            } catch (error) {
              console.error("[Event] Failed to refund AI credit:", error);
            }
          });
        }

        console.warn(
          `[Event] Output type ${contentResult.outputType} not supported for trigger ${triggerId}`
        );
        await recordAutomatedWorkflowPauseStep(context, {
          manual,
          stepName: "record-unsupported-output-pause",
          triggerId,
          organizationId: trigger.organizationId,
          automationName: trigger.name.trim() || `${eventType} event`,
          reason: "workflow_errors",
          logPrefix: "Event",
        });
        await context.cancel();
        return;
      }

      if (contentResult.status === "generation_failed") {
        await context.run("track-generation-end-failure", async () => {
          await completeActiveGeneration(trigger.organizationId, {
            runId,
            triggerId,
            outputType: trigger.outputType,
            triggerName: trigger.name.trim() || `${eventType} event`,
            status: "failed",
            reason: contentResult.reason,
            completedAt: new Date().toISOString(),
          });
        });

        const autumnClient = autumn;
        if (aiCreditReservation.reserved && autumnClient) {
          await context.run("refund-ai-credit-failure", async () => {
            try {
              await autumnClient.track({
                customerId: trigger.organizationId,
                featureId: FEATURES.AI_CREDITS,
                value: 0,
                properties: {
                  source: "workflow_event",
                  output_type: trigger.outputType,
                  trigger_name: trigger.name.trim() || `${eventType} event`,
                  trigger_id: triggerId,
                  run_id: runId,
                  event_type: eventType,
                  refund_reason: "generation_failed",
                },
              });
            } catch (error) {
              console.error("[Event] Failed to refund AI credit:", error);
            }
          });
        }

        await context.run("log-generation-failure", async () => {
          await appendWebhookLog({
            organizationId: trigger.organizationId,
            integrationId: triggerId,
            integrationType: "events",
            title: `Event "${trigger.name.trim() || eventType}" failed to generate content`,
            status: "failed",
            statusCode: null,
            errorMessage: contentResult.reason,
            retentionDays: logRetentionDays,
          });
        });

        await context.run("track-content-failed", async () => {
          try {
            await trackScheduledContentFailed({
              triggerId: trigger.id,
              organizationId: trigger.organizationId,
              outputType: trigger.outputType,
              creationMode: "automatic",
              reason: contentResult.reason,
              lookbackWindow,
              repositoryCount: 1,
              source: "event",
            });
          } catch (trackingError) {
            console.warn("[Event] Failed to track content generation failure", {
              triggerId,
              organizationId: trigger.organizationId,
              error: trackingError,
            });
          }
        });

        console.log(
          `[Event] Content generation failed for trigger ${triggerId}: ${contentResult.reason}`
        );
        await recordAutomatedWorkflowPauseStep(context, {
          manual,
          stepName: "record-generation-failure-pause",
          triggerId,
          organizationId: trigger.organizationId,
          automationName: trigger.name.trim() || `${eventType} event`,
          reason: "workflow_errors",
          logPrefix: "Event",
        });
        await context.cancel();
        return;
      }

      if (contentResult.status === "skipped") {
        await context.run("track-generation-end-skipped", async () => {
          await completeActiveGeneration(trigger.organizationId, {
            runId,
            triggerId,
            outputType: trigger.outputType,
            triggerName: trigger.name.trim() || `${eventType} event`,
            status: "skipped",
            reason: contentResult.reason,
            completedAt: new Date().toISOString(),
          });
        });

        const autumnClient = autumn;
        if (aiCreditReservation.reserved && autumnClient) {
          await context.run("refund-ai-credit-skipped", async () => {
            try {
              await autumnClient.track({
                customerId: trigger.organizationId,
                featureId: FEATURES.AI_CREDITS,
                value: 0,
                properties: {
                  source: "workflow_event",
                  output_type: trigger.outputType,
                  trigger_name: trigger.name.trim() || `${eventType} event`,
                  trigger_id: triggerId,
                  run_id: runId,
                  event_type: eventType,
                  refund_reason: "skipped",
                },
              });
            } catch (error) {
              console.error("[Event] Failed to refund AI credit:", error);
            }
          });
        }

        await context.run("log-generation-skipped", async () => {
          await appendWebhookLog({
            organizationId: trigger.organizationId,
            integrationId: triggerId,
            integrationType: "events",
            title: `Event "${trigger.name.trim() || eventType}" skipped content generation`,
            status: "skipped",
            statusCode: null,
            errorMessage: contentResult.reason,
            retentionDays: logRetentionDays,
          });
        });

        await context.run("track-content-skipped", async () => {
          try {
            await trackScheduledContentSkipped({
              triggerId: trigger.id,
              organizationId: trigger.organizationId,
              outputType: trigger.outputType,
              creationMode: "automatic",
              reason: contentResult.reason,
              lookbackWindow,
              repositoryCount: 1,
              source: "event",
            });
          } catch (trackingError) {
            console.warn("[Event] Failed to track content generation skip", {
              triggerId,
              organizationId: trigger.organizationId,
              error: trackingError,
            });
          }
        });

        console.log(
          `[Event] Content generation skipped for trigger ${triggerId}: ${contentResult.reason}`
        );
        await clearAutomatedWorkflowPauseStateStep(context, {
          manual,
          stepName: "clear-skipped-workflow-pause-state",
          triggerId,
          logPrefix: "Event",
        });
        await context.cancel();
        return;
      }

      const createdPosts = contentResult.posts;

      if (createdPosts.length === 0) {
        console.warn("[Event] Content generation returned no posts", {
          triggerId,
          organizationId: trigger.organizationId,
        });
        await recordAutomatedWorkflowPauseStep(context, {
          manual,
          stepName: "record-empty-result-pause",
          triggerId,
          organizationId: trigger.organizationId,
          automationName: trigger.name.trim() || `${eventType} event`,
          reason: "workflow_errors",
          logPrefix: "Event",
        });
        await context.cancel();
        return;
      }

      const [primaryPost] = createdPosts;

      if (!primaryPost) {
        console.warn("[Event] Missing primary post after generation", {
          triggerId,
          organizationId: trigger.organizationId,
        });
        await recordAutomatedWorkflowPauseStep(context, {
          manual,
          stepName: "record-missing-primary-post-pause",
          triggerId,
          organizationId: trigger.organizationId,
          automationName: trigger.name.trim() || `${eventType} event`,
          reason: "workflow_errors",
          logPrefix: "Event",
        });
        await context.cancel();
        return;
      }

      const postId = primaryPost.postId;
      const contentTitle =
        createdPosts.length === 1
          ? primaryPost.title
          : `${createdPosts.length} ${trigger.outputType.replaceAll("_", " ")} drafts`;

      await context.run("track-generation-end-success", async () => {
        await completeActiveGeneration(trigger.organizationId, {
          runId,
          triggerId,
          outputType: trigger.outputType,
          triggerName: trigger.name.trim() || `${eventType} event`,
          status: "success",
          title: contentTitle,
          completedAt: new Date().toISOString(),
        });
      });

      await context.run("log-generation-success", async () => {
        await appendWebhookLog({
          organizationId: trigger.organizationId,
          integrationId: triggerId,
          integrationType: "events",
          title:
            createdPosts.length === 1
              ? `Event "${trigger.name.trim() || eventType}" created "${contentTitle}"`
              : `Event "${trigger.name.trim() || eventType}" created ${createdPosts.length} drafts`,
          status: "success",
          statusCode: null,
          referenceId: postId,
          retentionDays: logRetentionDays,
        });
      });

      await context.run("track-content-created", async () => {
        const trackingResults = await Promise.allSettled(
          createdPosts.map((createdPost) =>
            trackScheduledContentCreated({
              triggerId: trigger.id,
              organizationId: trigger.organizationId,
              postId: createdPost.postId,
              outputType: trigger.outputType,
              creationMode: "automatic",
              lookbackWindow,
              repositoryCount: 1,
              source: "event",
            })
          )
        );

        const failedTracking = trackingResults.flatMap((result, index) =>
          result.status === "rejected"
            ? [
                {
                  postId: createdPosts[index]?.postId ?? "unknown",
                  error: result.reason,
                },
              ]
            : []
        );

        if (failedTracking.length > 0) {
          console.warn("[Event] Failed to track some created posts", {
            triggerId,
            organizationId: trigger.organizationId,
            failures: failedTracking,
          });
        }
      });

      const autumnClientSuccess = autumn;
      const contentUsage = contentResult.usage;
      if (aiCreditReservation.reserved && autumnClientSuccess && contentUsage) {
        await context.run("track-ai-credit-usage", async () => {
          const cost = calculateAiCreditCostCents(
            contentUsage,
            contentUsage.modelId ?? "anthropic/claude-sonnet-4.6",
            aiCreditReservation.useMarkup
          );
          await autumnClientSuccess.track({
            customerId: trigger.organizationId,
            featureId: FEATURES.AI_CREDITS,
            value: cost.costCents,
            properties: {
              source: "workflow_event",
              output_type: trigger.outputType,
              trigger_name: trigger.name,
              model: contentResult.usage?.modelId,
              billing_basis: cost.billingBasis,
              input_tokens: contentResult.usage?.inputTokens,
              output_tokens: contentResult.usage?.outputTokens,
              cache_read_tokens: contentResult.usage?.cacheReadTokens,
              cache_write_tokens: contentResult.usage?.cacheWriteTokens,
              total_tokens: contentResult.usage?.totalTokens,
              sandbox_total_usd: contentResult.usage?.totalUsd,
              markup_applied: aiCreditReservation.useMarkup,
              cost_cents: cost.costCents,
              reported_cost_cents: cost.reportedCostCents,
              token_cost_cents: cost.tokenCostCents,
            },
          });
        });
      } else if (aiCreditReservation.reserved && autumnClientSuccess) {
        await context.run("track-ai-credit-fallback", async () => {
          await autumnClientSuccess.track({
            customerId: trigger.organizationId,
            featureId: FEATURES.AI_CREDITS,
            value: 1,
            properties: {
              source: "workflow_event",
              output_type: trigger.outputType,
              trigger_name: trigger.name,
              fallback: true,
            },
          });
        });
      }

      const notificationData = await context.run<{
        enabled: boolean;
        ownerEmails: string[];
        organizationName: string;
        organizationSlug: string;
      }>("fetch-notification-data", async () => {
        const notificationSettings =
          await db.query.organizationNotificationSettings.findFirst({
            where: eq(
              organizationNotificationSettings.organizationId,
              trigger.organizationId
            ),
          });

        if (!notificationSettings?.scheduledContentCreation) {
          return {
            enabled: false,
            ownerEmails: [],
            organizationName: "",
            organizationSlug: "",
          };
        }

        const org = await db.query.organizations.findFirst({
          where: eq(organizations.id, trigger.organizationId),
          columns: { name: true, slug: true },
        });

        const ownerMemberships = await db.query.members.findMany({
          where: and(
            eq(members.organizationId, trigger.organizationId),
            eq(members.role, "owner")
          ),
          with: { users: { columns: { email: true } } },
        });

        return {
          enabled: true,
          ownerEmails: ownerMemberships.map((m) => m.users.email),
          organizationName: org?.name ?? "Your organization",
          organizationSlug: org?.slug ?? "",
        };
      });

      if (notificationData.enabled && notificationData.ownerEmails.length > 0) {
        await context.run("send-notification-emails", async () => {
          const baseUrl =
            process.env.BETTER_AUTH_URL ?? "https://app.usenotra.com";
          const contentOverviewLink = `${baseUrl}/${notificationData.organizationSlug}/content`;
          const createdContent = createdPosts.map((createdPost) => ({
            title: createdPost.title,
            contentLink: `${contentOverviewLink}/${createdPost.postId}`,
          }));
          const triggerName = trigger.name.trim() || `${eventType} event`;

          await enqueueContentEmailDigest({
            organizationId: trigger.organizationId,
            recipientEmails: notificationData.ownerEmails,
            kind: "scheduled_content_created",
            event: {
              organizationName: notificationData.organizationName,
              organizationSlug: notificationData.organizationSlug,
              scheduleName: triggerName,
              createdContent,
              contentType: trigger.outputType,
              contentOverviewLink,
              subject: `New content created from ${eventType} event`,
            },
            logPrefix: "Event",
          });
        });
      }

      await clearAutomatedWorkflowPauseStateStep(context, {
        manual,
        stepName: "clear-successful-workflow-pause-state",
        triggerId,
        logPrefix: "Event",
      });

      return { success: true, triggerId, postId, eventType };
    } catch (error) {
      if (error instanceof WorkflowAbort) {
        throw error;
      }

      await context.run("track-generation-end-error", async () => {
        await completeActiveGeneration(trigger.organizationId, {
          runId,
          triggerId,
          outputType: trigger.outputType,
          triggerName: trigger.name.trim() || `${eventType} event`,
          status: "failed",
          reason: "Unexpected workflow error",
          completedAt: new Date().toISOString(),
        });
      });

      const autumnClient = autumn;
      if (aiCreditReservation.reserved && autumnClient) {
        await context.run("refund-ai-credit-error", async () => {
          try {
            await autumnClient.track({
              customerId: trigger.organizationId,
              featureId: FEATURES.AI_CREDITS,
              value: 0,
              properties: {
                source: "workflow_event",
                output_type: trigger.outputType,
                trigger_name: trigger.name.trim() || `${eventType} event`,
                trigger_id: triggerId,
                run_id: runId,
                event_type: eventType,
                refund_reason: "workflow_error",
              },
            });
          } catch (refundError) {
            console.error("[Event] Failed to refund AI credit:", refundError);
          }
        });
      }

      await recordAutomatedWorkflowPauseStep(context, {
        manual,
        stepName: "record-unexpected-error-pause",
        triggerId,
        organizationId: trigger.organizationId,
        automationName: trigger.name.trim() || `${eventType} event`,
        reason: "workflow_errors",
        logPrefix: "Event",
      });

      throw error;
    }
  },
  {
    baseUrl: getBaseUrl(),
    failureFunction: async ({ context, failStatus, failResponse }) => {
      console.error(
        `[Event] Workflow failed for trigger ${context.requestPayload.triggerId}:`,
        { status: failStatus, response: failResponse }
      );
    },
  }
);
