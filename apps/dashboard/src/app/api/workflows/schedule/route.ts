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
} from "@notra/db/schema";
import { getResend } from "@notra/email/utils/resend";
import type { WorkflowContext } from "@upstash/workflow";
import { WorkflowAbort } from "@upstash/workflow";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq, inArray } from "drizzle-orm";

import { FEATURES } from "@/constants/features";
import { GITHUB_RATE_LIMIT_RETRY_DELAY } from "@/constants/workflows";
import { autumn } from "@/lib/billing/autumn";
import {
  trackScheduledContentCreated,
  trackScheduledContentFailed,
} from "@/lib/databuddy";
import {
  sendScheduledContentCreatedEmail,
  sendScheduledContentFailedEmail,
} from "@/lib/email/send";
import {
  addActiveGeneration,
  completeActiveGeneration,
  generateRunId,
} from "@/lib/generations/tracking";
import { getBaseUrl, triggerScheduleNow } from "@/lib/triggers/qstash";
import { appendWebhookLog } from "@/lib/webhooks/logging";
import { generateScheduledContent } from "@/lib/workflows/schedule/handlers";
import type { ContentGenerationResult } from "@/lib/workflows/schedule/types";
import {
  formatUtcTodayContext,
  resolveLookbackRange,
} from "@/lib/workflows/shared/lookback";
import {
  parseLookbackWindow,
  parseTriggerOutputConfig,
  parseTriggerTargets,
} from "@/lib/workflows/shared/parsing";
import { getValidToneProfile } from "@/schemas/brand";
import type { LookbackWindow } from "@/schemas/integrations";

import {
  type ScheduleWorkflowPayload,
  scheduleWorkflowPayloadSchema,
} from "@/schemas/workflows";

interface TriggerData {
  id: string;
  name: string;
  organizationId: string;
  sourceType: string;
  sourceConfig: unknown;
  targets: { repositoryIds: string[] };
  outputType: string;
  outputConfig: unknown;
  enabled: boolean;
}

interface RepositoryData {
  id: string;
  owner: string;
  repo: string;
  defaultBranch: string | null;
}

type BrandSettingsData = {
  id: string;
  name: string;
  toneProfile: string | null;
  companyName: string | null;
  companyDescription: string | null;
  audience: string | null;
  customInstructions: string | null;
  language: string | null;
} | null;

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

    // Step 1: Fetch trigger configuration
    const trigger = await context.run<TriggerData | null>(
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
          .where(inArray(githubIntegrations.id, repositoryIds));

        return repos.filter(
          (repo): repo is RepositoryData => !!(repo.owner && repo.repo)
        );
      }
    );

    if (repositories.length === 0) {
      console.log(
        `[Schedule] No valid repositories for trigger ${triggerId}, canceling`
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

    const aiCreditReservation = await context.run<{
      canceled: boolean;
      reserved: boolean;
    }>("reserve-ai-credit", async () => {
      if (!autumn) {
        return { canceled: false, reserved: false };
      }

      const { data, error } = await autumn.check({
        customer_id: trigger.organizationId,
        feature_id: FEATURES.AI_CREDITS,
        required_balance: 1,
        send_event: true,
      });

      if (error) {
        throw new Error(`Autumn check failed: ${String(error)}`);
      }

      if (!data?.allowed) {
        console.warn(
          `[Schedule] AI credit limit reached for org ${trigger.organizationId}, canceling trigger ${triggerId}`,
          {
            balance: data?.balance ?? 0,
          }
        );
        await context.cancel();
        return { canceled: true, reserved: false };
      }

      return { canceled: false, reserved: true };
    });

    if (aiCreditReservation.canceled) {
      return;
    }

    const runId = await context.run("generate-run-id", () =>
      generateRunId(triggerId)
    );

    await context.run("track-generation-start", async () => {
      await addActiveGeneration(trigger.organizationId, {
        runId,
        triggerId: trigger.id,
        outputType: trigger.outputType,
        triggerName: trigger.name.trim() || trigger.outputType,
        startedAt: new Date().toISOString(),
      });
    });

    // Step 3: Generate content based on output type
    try {
      const contentResult = await context.run<ContentGenerationResult>(
        "generate-content",
        async () => {
          const lookbackRange = resolveLookbackRange(lookbackWindow);
          const todayUtc = formatUtcTodayContext(lookbackRange.end);
          const repoList = repositories
            .map((r) => `integrationId: ${r.id}`)
            .join(", ");

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
            sourceTargets: repoList,
            todayUtc,
            lookbackLabel: lookbackRange.label,
            lookbackStartIso: lookbackRange.start.toISOString(),
            lookbackEndIso: lookbackRange.end.toISOString(),
            companyName: brand?.companyName ?? undefined,
            companyDescription: brand?.companyDescription ?? undefined,
            audience: brand?.audience ?? undefined,
            customInstructions: brand?.customInstructions ?? null,
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

          return generateScheduledContent(trigger.outputType, {
            organizationId: trigger.organizationId,
            repositories: repositoryParams,
            tone,
            promptInput,
            sourceMetadata,
            voiceId: brand?.id,
          });
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
            const { error } = await autumnClient.track({
              customer_id: trigger.organizationId,
              feature_id: FEATURES.AI_CREDITS,
              value: 0,
            });

            if (error) {
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
              const { error } = await autumnClient.track({
                customer_id: trigger.organizationId,
                feature_id: FEATURES.AI_CREDITS,
                value: 0,
              });

              if (error) {
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

        await context.cancel();
        return;
      }

      if (contentResult.status === "generation_failed") {
        const autumnClient = autumn;
        if (aiCreditReservation.reserved && autumnClient) {
          await context.run(
            "refund-ai-credit-after-generation-failure",
            async () => {
              const { error } = await autumnClient.track({
                customer_id: trigger.organizationId,
                feature_id: FEATURES.AI_CREDITS,
                value: 0,
              });

              if (error) {
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

        console.error(
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
              reason: contentResult.reason,
              lookbackWindow,
              repositoryCount: repositories.length,
              source: "schedule",
            });
          } catch (trackingError) {
            console.error(
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
            const resend = getResend();
            if (!resend) {
              return;
            }

            const scheduleName = trigger.name.trim() || trigger.outputType;

            await Promise.allSettled(
              failureNotificationData.ownerEmails.map((email) =>
                sendScheduledContentFailedEmail(resend, {
                  recipientEmail: email,
                  organizationName: failureNotificationData.organizationName,
                  organizationSlug: failureNotificationData.organizationSlug,
                  scheduleName,
                  reason: contentResult.reason,
                }).then((result) => {
                  if (result.error) {
                    console.error(
                      `[Schedule] Failed to send failure notification to ${email}:`,
                      result.error
                    );
                  }
                })
              )
            );
          });
        }

        await context.cancel();
        return;
      }

      const createdPosts = contentResult.posts;

      if (createdPosts.length === 0) {
        console.error("[Schedule] Content generation returned no posts", {
          triggerId,
          organizationId: trigger.organizationId,
        });
        await context.cancel();
        return;
      }

      const [primaryPost] = createdPosts;

      if (!primaryPost) {
        console.error("[Schedule] Missing primary post after generation", {
          triggerId,
          organizationId: trigger.organizationId,
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
          console.error("[Schedule] Failed to track some created posts", {
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
          const resend = getResend();
          if (!resend) {
            console.warn(
              "[Schedule] Resend API key not configured, skipping notification emails"
            );
            return;
          }
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

          await Promise.allSettled(
            notificationData.ownerEmails.map((email) =>
              sendScheduledContentCreatedEmail(resend, {
                recipientEmail: email,
                organizationName: notificationData.organizationName,
                scheduleName,
                createdContent,
                contentType: trigger.outputType,
                contentOverviewLink,
                organizationSlug: notificationData.organizationSlug,
                subject,
              }).then((result) => {
                if (result.error) {
                  console.error(
                    `[Schedule] Failed to send notification to ${email}:`,
                    result.error
                  );
                }
              })
            )
          );
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
          const { error: refundError } = await autumnClient.track({
            customer_id: trigger.organizationId,
            feature_id: FEATURES.AI_CREDITS,
            value: 0,
          });

          if (refundError) {
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
