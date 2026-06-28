import { calculateAiCreditCostCents } from "@notra/ai/billing/ai-credit-cost";
import { autumn } from "@notra/ai/billing/autumn";
import { FEATURES } from "@notra/ai/billing/features";
import { getGitHubToolRepositoryContextByIntegrationId } from "@notra/ai/integrations/github";
import { getLinearToolContextByIntegrationId } from "@notra/ai/integrations/linear";
import { getBaseUrl, triggerScheduleNow } from "@notra/ai/qstash/triggers";
import { getValidToneProfile } from "@notra/ai/schemas/tone";
import { db } from "@notra/db/drizzle";
import type { PostSourceMetadata } from "@notra/db/schema";
import {
  brandSettings,
  contentTriggerLookbackWindows,
  contentTriggers,
  githubIntegrations,
  linearIntegrations,
  members,
  organizationNotificationSettings,
  organizations,
  postCollections,
} from "@notra/db/schema";
import { buildPostCollectionName } from "@notra/db/utils/post-collections";
import type { WorkflowContext } from "@upstash/workflow";
import { WorkflowAbort } from "@upstash/workflow";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq, inArray } from "drizzle-orm";
import { createRequestLogger } from "evlog";
import { GITHUB_RATE_LIMIT_RETRY_DELAY } from "@/constants/workflows";
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
import { buildDataPointRestrictionInstructions } from "@/lib/workflows/on-demand/helpers";
import { generateScheduledContent } from "@/lib/workflows/schedule/handlers";
import type { ContentGenerationResult } from "@/lib/workflows/schedule/types";
import { sendAiCreditsDepletedEmails } from "@/lib/workflows/shared/ai-credit-notifications";
import { enqueueContentEmailDigest } from "@/lib/workflows/shared/content-email-digest-enqueue";
import {
  parseLookbackWindow,
  parseTriggerOutputConfig,
  parseTriggerTargets,
} from "@/lib/workflows/shared/parsing";
import type { LookbackWindow } from "@/schemas/integrations";
import {
  type ScheduleWorkflowPayload,
  scheduleWorkflowPayloadSchema,
} from "@/schemas/workflows";
import type {
  ScheduleBrandSettingsData as BrandSettingsData,
  ScheduleRepositoryData as RepositoryData,
  ScheduleTriggerData,
} from "@/types/workflows/workflows";
import { formatTodayContext, resolveLookbackRange } from "@/utils/lookback";

async function deleteEmptyPostCollection(params: {
  collectionId: string;
  organizationId: string;
}) {
  await db
    .delete(postCollections)
    .where(
      and(
        eq(postCollections.id, params.collectionId),
        eq(postCollections.organizationId, params.organizationId),
        eq(postCollections.completedPostCount, 0)
      )
    );
}

export const { POST } = serve<ScheduleWorkflowPayload>(
  async (context: WorkflowContext<ScheduleWorkflowPayload>) => {
    const parseResult = scheduleWorkflowPayloadSchema.safeParse(
      context.requestPayload
    );
    if (!parseResult.success) {
      console.error("[Schedule] Invalid payload:", parseResult.error.flatten());
      await context.cancel();
      return;
    }
    const { triggerId, manual } = parseResult.data;
    const creationMode = manual ? "manual" : "automatic";

    // Step 1: Fetch trigger configuration
    const trigger = await context.run<ScheduleTriggerData | null>(
      "fetch-trigger",
      async () => {
        const result = await db.query.contentTriggers.findFirst({
          where: eq(contentTriggers.id, triggerId),
        });

        if (!result) {
          return null;
        }

        const parsedTargets = parseTriggerTargets(result.targets);
        if (!parsedTargets) {
          return null;
        }

        return {
          id: result.id,
          name: result.name,
          organizationId: result.organizationId,
          sourceType: result.sourceType,
          sourceConfig: result.sourceConfig,
          targets: parsedTargets,
          outputType: result.outputType,
          outputConfig: result.outputConfig,
          enabled: result.enabled,
          autoPublish: result.autoPublish,
        };
      }
    );

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

    if (!trigger) {
      console.log(`[Schedule] Trigger ${triggerId} not found, canceling`);
      await context.cancel();
      return;
    }

    if (!trigger.enabled) {
      console.log(`[Schedule] Trigger ${triggerId} is disabled, canceling`);
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
          `[Schedule] No active paid plan for org ${trigger.organizationId}, canceling trigger ${triggerId} without notification`
        );
      }

      if (aiCreditReservation.shouldNotify) {
        await context.run("send-ai-credits-depleted-emails", () =>
          sendAiCreditsDepletedEmails({
            organizationId: trigger.organizationId,
            automationName: trigger.name.trim() || trigger.outputType,
            logPrefix: "Schedule",
          })
        );

        console.warn(
          `[Schedule] AI credits depleted for paid org ${trigger.organizationId}, canceling trigger ${triggerId}`,
          { balanceRemaining: aiCreditReservation.balanceRemaining }
        );
      }

      await context.cancel();
      return;
    }

    // Step 2: Fetch repository data for targets
    const repositories = await context.run<RepositoryData[]>(
      "fetch-repositories",
      async () => {
        const repositoryIds = trigger.targets.repositoryIds;

        if (repositoryIds.length === 0) {
          return [];
        }

        const repos = await db
          .select({
            id: githubIntegrations.id,
            owner: githubIntegrations.owner,
            repo: githubIntegrations.repo,
            defaultBranch: githubIntegrations.defaultBranch,
          })
          .from(githubIntegrations)
          .where(
            and(
              eq(githubIntegrations.organizationId, trigger.organizationId),
              inArray(githubIntegrations.id, repositoryIds)
            )
          );

        return repos.filter(
          (repo): repo is RepositoryData => !!(repo.owner && repo.repo)
        );
      }
    );

    const linearIntegrationRefs = await context.run<
      Array<{ integrationId: string; teamName?: string }>
    >("fetch-linear-integrations", async () => {
      const integrations = await db
        .select({
          id: linearIntegrations.id,
          linearTeamName: linearIntegrations.linearTeamName,
        })
        .from(linearIntegrations)
        .where(
          and(
            eq(linearIntegrations.organizationId, trigger.organizationId),
            eq(linearIntegrations.enabled, true)
          )
        );

      return integrations.map((i) => ({
        integrationId: i.id,
        teamName: i.linearTeamName ?? undefined,
      }));
    });

    if (repositories.length === 0 && linearIntegrationRefs.length === 0) {
      console.log(
        `[Schedule] No valid data sources for trigger ${triggerId}, canceling`
      );
      await context.cancel();
      return;
    }

    // Step 2.5: Fetch brand settings for the organization
    const brand = await context.run<BrandSettingsData>(
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

    const runId = await context.run("generate-run-id", () =>
      generateRunId(triggerId)
    );

    const collectionId = `group_${runId}`;

    try {
      await context.run("track-generation-start", async () => {
        await addActiveGeneration(trigger.organizationId, {
          runId,
          triggerId: trigger.id,
          outputType: trigger.outputType,
          triggerName: trigger.name.trim() || trigger.outputType,
          startedAt: new Date().toISOString(),
        });
      });

      await context.run("create-post-collection", async () => {
        const now = new Date();

        await db.insert(postCollections).values({
          id: collectionId,
          organizationId: trigger.organizationId,
          source: trigger.sourceType === "cron" ? "schedule" : "automation",
          sourceId: runId,
          name: buildPostCollectionName([trigger.outputType], now),
          nameSource: "generated",
          contentTypes: [trigger.outputType],
          sourceMetadata: {
            triggerId: trigger.id,
            triggerName: trigger.name,
            triggerSourceType: trigger.sourceType,
            manualRun: manual,
          },
          expectedPostCount: 1,
          completedPostCount: 0,
          createdAt: now,
          updatedAt: now,
        });
      });

      const generationUserId = await context.run<string | undefined>(
        "fetch-generation-user-id",
        async () => {
          const ownerMembership = await db.query.members.findFirst({
            where: and(
              eq(members.organizationId, trigger.organizationId),
              eq(members.role, "owner")
            ),
            columns: { userId: true },
          });

          if (ownerMembership?.userId) {
            return ownerMembership.userId;
          }

          const membership = await db.query.members.findFirst({
            where: eq(members.organizationId, trigger.organizationId),
            columns: { userId: true },
          });

          return membership?.userId;
        }
      );

      // Step 3: Generate content based on output type
      const contentResult = await context.run<ContentGenerationResult>(
        "generate-content",
        async () => {
          const lookbackRange = resolveLookbackRange(lookbackWindow);
          const todayUtc = formatTodayContext(lookbackRange.end);

          const hasLinear = linearIntegrationRefs.length > 0;
          const dataPointSettings = {
            includePullRequests: true,
            includeCommits: true,
            includeReleases: true,
            includeLinearData: hasLinear,
          };

          const sourceTargetParts = repositories.map(
            (r) => `${r.owner}/${r.repo} (integrationId: ${r.id})`
          );
          for (const ref of linearIntegrationRefs) {
            sourceTargetParts.push(
              `Linear${ref.teamName ? ` / ${ref.teamName}` : ""} (integrationId: ${ref.integrationId})`
            );
          }

          const restrictionInstructions =
            buildDataPointRestrictionInstructions(dataPointSettings);
          const customInstructions = [
            brand?.customInstructions?.trim() ?? "",
            restrictionInstructions ?? "",
          ]
            .filter((v) => v.length > 0)
            .join("\n\n");

          const sourceMetadata: PostSourceMetadata = {
            triggerId: trigger.id,
            triggerSourceType: trigger.sourceType,
            repositories: repositories.map((r) => ({
              owner: r.owner,
              repo: r.repo,
            })),
            lookbackWindow,
            lookbackRange: {
              start: lookbackRange.start.toISOString(),
              end: lookbackRange.end.toISOString(),
            },
            brandVoiceName: brand?.name,
            brandVoiceId: brand?.id,
          };

          const promptInput = {
            sourceTargets: sourceTargetParts.join(", "),
            todayUtc,
            lookbackLabel: lookbackRange.label,
            lookbackStartIso: lookbackRange.start.toISOString(),
            lookbackEndIso: lookbackRange.end.toISOString(),
            companyName: brand?.companyName ?? undefined,
            companyDescription: brand?.companyDescription ?? undefined,
            audience: brand?.audience ?? undefined,
            customInstructions: customInstructions || null,
            language: brand?.language ?? undefined,
          };

          const repositoryParams = repositories.map((repository) => ({
            integrationId: repository.id,
            owner: repository.owner,
            repo: repository.repo,
            defaultBranch: repository.defaultBranch,
          }));

          const tone = getValidToneProfile(
            brand?.toneProfile,
            "Conversational"
          );

          const log = createRequestLogger({
            method: "POST",
            path: "/api/workflows/schedule",
          });

          log.set({
            feature: "scheduled_content_generation",
            organizationId: trigger.organizationId,
            triggerId,
            outputType: trigger.outputType,
            manual,
          });

          try {
            return await generateScheduledContent(trigger.outputType, {
              organizationId: trigger.organizationId,
              userId: generationUserId,
              collectionId,
              repositories: repositoryParams,
              linearIntegrations: linearIntegrationRefs,
              tone,
              promptInput,
              sourceMetadata,
              dataPointSettings,
              commitWindow: {
                since: lookbackRange.start.toISOString(),
                until: lookbackRange.end.toISOString(),
              },
              voiceId: brand?.id,
              autoPublish: trigger.autoPublish,
              resolveContext: getGitHubToolRepositoryContextByIntegrationId,
              resolveLinearContext: getLinearToolContextByIntegrationId,
              log,
              telemetryMetadata: {
                contentType: trigger.outputType,
                feature: "content_generation",
                generationMode: creationMode,
                organizationId: trigger.organizationId,
                routeName: "/api/workflows/schedule",
                triggerId,
                triggerName: trigger.name,
                triggerSourceType: trigger.sourceType,
                voiceId: brand?.id,
              },
            });
          } finally {
            log.emit();
          }
        }
      );

      if (contentResult.status === "rate_limited") {
        await context.run("track-generation-end-rate-limit", async () => {
          await completeActiveGeneration(trigger.organizationId, {
            runId,
            triggerId,
            outputType: trigger.outputType,
            triggerName: trigger.name.trim() || trigger.outputType,
            status: "failed",
            reason: "GitHub API rate limit hit, will retry",
            completedAt: new Date().toISOString(),
          });
        });

        const autumnClient = autumn;
        if (aiCreditReservation.reserved && autumnClient) {
          await context.run("refund-ai-credit-after-rate-limit", async () => {
            try {
              await autumnClient.track({
                customerId: trigger.organizationId,
                featureId: FEATURES.AI_CREDITS,
                value: 0,
                properties: {
                  source: "workflow_schedule",
                  output_type: trigger.outputType,
                  trigger_name: trigger.name.trim() || trigger.outputType,
                  trigger_id: triggerId,
                  run_id: runId,
                  refund_reason: "rate_limited",
                },
              });
            } catch (error) {
              console.error(
                "[Schedule] Failed to refund AI credit after rate limit",
                {
                  triggerId,
                  organizationId: trigger.organizationId,
                  error,
                }
              );
            }
          });
        }

        const delayedWorkflowRunId = await context.run<string>(
          "reschedule-after-github-rate-limit",
          async () =>
            triggerScheduleNow(triggerId, {
              delay: GITHUB_RATE_LIMIT_RETRY_DELAY,
            })
        );

        console.warn(
          `[Schedule] GitHub API rate limit hit for trigger ${triggerId}. Delayed workflow ${delayedWorkflowRunId} by ${GITHUB_RATE_LIMIT_RETRY_DELAY}.`,
          {
            retryAfterSeconds: contentResult.retryAfterSeconds,
          }
        );

        await context.run("cleanup-post-collection-rate-limit", async () => {
          await deleteEmptyPostCollection({
            collectionId,
            organizationId: trigger.organizationId,
          });
        });

        await context.cancel();
        return;
      }

      if (contentResult.status === "unsupported_output_type") {
        await context.run("track-generation-end-unsupported", async () => {
          await completeActiveGeneration(trigger.organizationId, {
            runId,
            triggerId,
            outputType: trigger.outputType,
            triggerName: trigger.name.trim() || trigger.outputType,
            status: "failed",
            reason: "Unsupported output type",
            completedAt: new Date().toISOString(),
          });
        });

        const autumnClient = autumn;
        if (aiCreditReservation.reserved && autumnClient) {
          await context.run(
            "refund-ai-credit-after-unsupported-output-type",
            async () => {
              try {
                await autumnClient.track({
                  customerId: trigger.organizationId,
                  featureId: FEATURES.AI_CREDITS,
                  value: 0,
                  properties: {
                    source: "workflow_schedule",
                    output_type: trigger.outputType,
                    trigger_name: trigger.name.trim() || trigger.outputType,
                    trigger_id: triggerId,
                    run_id: runId,
                    refund_reason: "unsupported_output_type",
                  },
                });
              } catch (error) {
                console.error(
                  "[Schedule] Failed to refund AI credit after unsupported output type",
                  {
                    triggerId,
                    organizationId: trigger.organizationId,
                    outputType: contentResult.outputType,
                    error,
                  }
                );
              }
            }
          );
        }

        console.warn(
          `[Schedule] Output type ${contentResult.outputType} is not implemented for trigger ${triggerId}. Canceling without retry.`
        );

        await context.run(
          "cleanup-post-collection-unsupported-output-type",
          async () => {
            await deleteEmptyPostCollection({
              collectionId,
              organizationId: trigger.organizationId,
            });
          }
        );

        await context.cancel();
        return;
      }

      if (contentResult.status === "generation_failed") {
        const autumnClient = autumn;
        if (aiCreditReservation.reserved && autumnClient) {
          await context.run(
            "refund-ai-credit-after-generation-failure",
            async () => {
              try {
                await autumnClient.track({
                  customerId: trigger.organizationId,
                  featureId: FEATURES.AI_CREDITS,
                  value: 0,
                  properties: {
                    source: "workflow_schedule",
                    output_type: trigger.outputType,
                    trigger_name: trigger.name.trim() || trigger.outputType,
                    trigger_id: triggerId,
                    run_id: runId,
                    refund_reason: "generation_failed",
                  },
                });
              } catch (error) {
                console.error(
                  "[Schedule] Failed to refund AI credit after generation failure",
                  {
                    triggerId,
                    organizationId: trigger.organizationId,
                    reason: contentResult.reason,
                    error,
                  }
                );
              }
            }
          );
        }

        console.log(
          `[Schedule] Content generation failed for trigger ${triggerId}: ${contentResult.reason}`
        );

        await context.run("track-generation-end-failure", async () => {
          await completeActiveGeneration(trigger.organizationId, {
            runId,
            triggerId,
            outputType: trigger.outputType,
            triggerName: trigger.name.trim() || trigger.outputType,
            status: "failed",
            reason: contentResult.reason,
            completedAt: new Date().toISOString(),
          });
        });

        await context.run("log-generation-failure", async () => {
          await appendWebhookLog({
            organizationId: trigger.organizationId,
            integrationId: triggerId,
            integrationType: manual ? "manual" : "schedule",
            title: `Schedule "${trigger.name.trim() || trigger.outputType}" failed to generate content`,
            status: "failed",
            statusCode: null,
            errorMessage: contentResult.reason,
          });
        });

        await context.run("track-content-failed", async () => {
          try {
            await trackScheduledContentFailed({
              triggerId: trigger.id,
              organizationId: trigger.organizationId,
              outputType: trigger.outputType,
              creationMode,
              reason: contentResult.reason,
              lookbackWindow,
              repositoryCount: repositories.length,
              source: "schedule",
            });
          } catch (trackingError) {
            console.warn(
              "[Schedule] Failed to track content generation failure",
              {
                triggerId,
                organizationId: trigger.organizationId,
                error: trackingError,
              }
            );
          }
        });

        const failureNotificationData = await context.run<{
          enabled: boolean;
          ownerEmails: string[];
          organizationName: string;
          organizationSlug: string;
        }>("fetch-failure-notification-data", async () => {
          const notificationSettings =
            await db.query.organizationNotificationSettings.findFirst({
              where: eq(
                organizationNotificationSettings.organizationId,
                trigger.organizationId
              ),
            });

          if (!notificationSettings?.scheduledContentFailed) {
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

        if (
          failureNotificationData.enabled &&
          failureNotificationData.ownerEmails.length > 0
        ) {
          await context.run("send-failure-notification-emails", async () => {
            const scheduleName = trigger.name.trim() || trigger.outputType;

            await enqueueContentEmailDigest({
              organizationId: trigger.organizationId,
              recipientEmails: failureNotificationData.ownerEmails,
              kind: "scheduled_content_failed",
              event: {
                organizationName: failureNotificationData.organizationName,
                organizationSlug: failureNotificationData.organizationSlug,
                scheduleName,
                reason: contentResult.reason,
              },
              logPrefix: "Schedule",
            });
          });
        }

        await context.run(
          "cleanup-post-collection-generation-failure",
          async () => {
            await deleteEmptyPostCollection({
              collectionId,
              organizationId: trigger.organizationId,
            });
          }
        );

        await context.cancel();
        return;
      }

      if (contentResult.status === "skipped") {
        const autumnClient = autumn;
        if (aiCreditReservation.reserved && autumnClient) {
          await context.run(
            "refund-ai-credit-after-generation-skip",
            async () => {
              try {
                await autumnClient.track({
                  customerId: trigger.organizationId,
                  featureId: FEATURES.AI_CREDITS,
                  value: 0,
                  properties: {
                    source: "workflow_schedule",
                    output_type: trigger.outputType,
                    trigger_name: trigger.name.trim() || trigger.outputType,
                    trigger_id: triggerId,
                    run_id: runId,
                    refund_reason: "skipped",
                  },
                });
              } catch (error) {
                console.error(
                  "[Schedule] Failed to refund AI credit after generation skip",
                  {
                    triggerId,
                    organizationId: trigger.organizationId,
                    reason: contentResult.reason,
                    error,
                  }
                );
              }
            }
          );
        }

        console.log(
          `[Schedule] Content generation skipped for trigger ${triggerId}: ${contentResult.reason}`
        );

        await context.run("track-generation-end-skipped", async () => {
          await completeActiveGeneration(trigger.organizationId, {
            runId,
            triggerId,
            outputType: trigger.outputType,
            triggerName: trigger.name.trim() || trigger.outputType,
            status: "skipped",
            reason: contentResult.reason,
            completedAt: new Date().toISOString(),
          });
        });

        await context.run("log-generation-skipped", async () => {
          await appendWebhookLog({
            organizationId: trigger.organizationId,
            integrationId: triggerId,
            integrationType: manual ? "manual" : "schedule",
            title: `Schedule "${trigger.name.trim() || trigger.outputType}" skipped content generation`,
            status: "skipped",
            statusCode: null,
            errorMessage: contentResult.reason,
          });
        });

        await context.run("track-content-skipped", async () => {
          try {
            await trackScheduledContentSkipped({
              triggerId: trigger.id,
              organizationId: trigger.organizationId,
              outputType: trigger.outputType,
              creationMode,
              reason: contentResult.reason,
              lookbackWindow,
              repositoryCount: repositories.length,
              source: "schedule",
            });
          } catch (trackingError) {
            console.warn("[Schedule] Failed to track generation skip", {
              triggerId,
              organizationId: trigger.organizationId,
              error: trackingError,
            });
          }
        });

        const skippedNotificationData = await context.run<{
          enabled: boolean;
          ownerEmails: string[];
          organizationName: string;
          organizationSlug: string;
        }>("fetch-skipped-notification-data", async () => {
          const notificationSettings =
            await db.query.organizationNotificationSettings.findFirst({
              where: eq(
                organizationNotificationSettings.organizationId,
                trigger.organizationId
              ),
            });

          if (!notificationSettings?.scheduledContentSkipped) {
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

        if (
          skippedNotificationData.enabled &&
          skippedNotificationData.ownerEmails.length > 0
        ) {
          await context.run("send-skipped-notification-emails", async () => {
            const scheduleName = trigger.name.trim() || trigger.outputType;

            await enqueueContentEmailDigest({
              organizationId: trigger.organizationId,
              recipientEmails: skippedNotificationData.ownerEmails,
              kind: "scheduled_content_skipped",
              event: {
                organizationName: skippedNotificationData.organizationName,
                organizationSlug: skippedNotificationData.organizationSlug,
                scheduleName,
                reason: contentResult.reason,
              },
              logPrefix: "Schedule",
            });
          });
        }

        await context.run(
          "cleanup-post-collection-generation-skip",
          async () => {
            await deleteEmptyPostCollection({
              collectionId,
              organizationId: trigger.organizationId,
            });
          }
        );

        await context.cancel();
        return;
      }

      const createdPosts = contentResult.posts;

      if (createdPosts.length === 0) {
        console.warn("[Schedule] Content generation returned no posts", {
          triggerId,
          organizationId: trigger.organizationId,
        });
        await context.run("cleanup-post-collection-empty-result", async () => {
          await deleteEmptyPostCollection({
            collectionId,
            organizationId: trigger.organizationId,
          });
        });
        await context.cancel();
        return;
      }

      const [primaryPost] = createdPosts;

      if (!primaryPost) {
        console.warn("[Schedule] Missing primary post after generation", {
          triggerId,
          organizationId: trigger.organizationId,
        });
        await context.run(
          "cleanup-post-collection-missing-primary-post",
          async () => {
            await deleteEmptyPostCollection({
              collectionId,
              organizationId: trigger.organizationId,
            });
          }
        );
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
          triggerName: trigger.name.trim() || trigger.outputType,
          status: "success",
          title: contentTitle,
          completedAt: new Date().toISOString(),
        });
      });

      await context.run("log-generation-success", async () => {
        await appendWebhookLog({
          organizationId: trigger.organizationId,
          integrationId: triggerId,
          integrationType: manual ? "manual" : "schedule",
          title:
            createdPosts.length === 1
              ? `Schedule "${trigger.name.trim() || trigger.outputType}" created "${contentTitle}"`
              : `Schedule "${trigger.name.trim() || trigger.outputType}" created ${createdPosts.length} drafts`,
          status: "success",
          statusCode: null,
          referenceId: postId,
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
              creationMode,
              lookbackWindow,
              repositoryCount: repositories.length,
              source: "schedule",
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
          console.warn("[Schedule] Failed to track some created posts", {
            triggerId,
            organizationId: trigger.organizationId,
            failures: failedTracking,
          });
        }
      });

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
          const scheduleName = trigger.name.trim() || trigger.outputType;
          const subject = manual
            ? `New content created from ${scheduleName}`
            : `Your ${scheduleName} schedule created new content`;

          await enqueueContentEmailDigest({
            organizationId: trigger.organizationId,
            recipientEmails: notificationData.ownerEmails,
            kind: "scheduled_content_created",
            event: {
              organizationName: notificationData.organizationName,
              organizationSlug: notificationData.organizationSlug,
              scheduleName,
              createdContent,
              contentType: trigger.outputType,
              contentOverviewLink,
              subject,
            },
            logPrefix: "Schedule",
          });
        });
      }

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
              source: "workflow_schedule",
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
              source: "workflow_schedule",
              output_type: trigger.outputType,
              trigger_name: trigger.name,
              fallback: true,
            },
          });
        });
      }

      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Schedule] Created ${createdPosts.length} post(s) for trigger ${triggerId}: ${createdPosts
            .map((createdPost) => createdPost.postId)
            .join(", ")}`
        );
      }

      return { success: true, triggerId, postId };
    } catch (error) {
      if (error instanceof WorkflowAbort) {
        throw error;
      }

      await context.run("track-generation-end-error", async () => {
        await completeActiveGeneration(trigger.organizationId, {
          runId,
          triggerId,
          outputType: trigger.outputType,
          triggerName: trigger.name.trim() || trigger.outputType,
          status: "failed",
          reason: "Unexpected workflow error",
          completedAt: new Date().toISOString(),
        });
      });

      const autumnClient = autumn;
      if (aiCreditReservation.reserved && autumnClient) {
        await context.run("refund-ai-credit-after-failure", async () => {
          try {
            await autumnClient.track({
              customerId: trigger.organizationId,
              featureId: FEATURES.AI_CREDITS,
              value: 0,
              properties: {
                source: "workflow_schedule",
                output_type: trigger.outputType,
                trigger_name: trigger.name.trim() || trigger.outputType,
                trigger_id: triggerId,
                run_id: runId,
                refund_reason: "workflow_error",
              },
            });
          } catch (refundError) {
            console.error(
              "[Schedule] Failed to refund AI credit after failure",
              {
                triggerId,
                organizationId: trigger.organizationId,
                error: refundError,
              }
            );
          }
        });
      }

      await context.run("cleanup-post-collection-workflow-error", async () => {
        await deleteEmptyPostCollection({
          collectionId,
          organizationId: trigger.organizationId,
        });
      });

      throw error;
    }
  },
  {
    baseUrl: getBaseUrl(),
    failureFunction: async ({ context, failStatus, failResponse }) => {
      console.error(
        `[Schedule] Workflow failed for trigger ${context.requestPayload.triggerId}:`,
        { status: failStatus, response: failResponse }
      );
    },
  }
);
