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
import { and, eq } from "drizzle-orm";
import { FEATURES } from "@/constants/features";
import { autumn } from "@/lib/billing/autumn";
import { checkLogRetention } from "@/lib/billing/check-log-retention";
import {
  trackScheduledContentCreated,
  trackScheduledContentFailed,
} from "@/lib/databuddy";
import { sendScheduledContentCreatedEmail } from "@/lib/email/send";
import {
  addActiveGeneration,
  completeActiveGeneration,
  generateRunId,
} from "@/lib/generations/tracking";
import { getBaseUrl } from "@/lib/triggers/qstash";
import { appendWebhookLog } from "@/lib/webhooks/logging";
import { generateEventBasedContent } from "@/lib/workflows/event/handlers";
import {
  parseLookbackWindow,
  parseTriggerOutputConfig,
} from "@/lib/workflows/shared/parsing";
import { getValidToneProfile } from "@/schemas/brand";
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
          `[Event] AI credit limit reached for org ${trigger.organizationId}, canceling trigger ${triggerId}`,
          { balance: data?.balance ?? 0 }
        );
        await context.cancel();
        return { canceled: true, reserved: false };
      }

      return { canceled: false, reserved: true };
    });

    if (aiCreditReservation.canceled) {
      return;
    }

    const logRetentionDays = await context.run<LogRetentionDays>(
      "fetch-retention",
      async () => checkLogRetention(trigger.organizationId)
    );

    const runId = await context.run("generate-run-id", () =>
      generateRunId(triggerId)
    );

    await context.run("track-generation-start", async () => {
      await addActiveGeneration(trigger.organizationId, {
        runId,
        triggerId: trigger.id,
        outputType: trigger.outputType,
        triggerName: trigger.name.trim() || `${eventType} event`,
        startedAt: new Date().toISOString(),
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
            const { error } = await autumnClient.track({
              customer_id: trigger.organizationId,
              feature_id: FEATURES.AI_CREDITS,
              value: 0,
            });

            if (error) {
              console.error("[Event] Failed to refund AI credit:", error);
            }
          });
        }

        console.warn(
          `[Event] Output type ${contentResult.outputType} not supported for trigger ${triggerId}`
        );
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
            const { error } = await autumnClient.track({
              customer_id: trigger.organizationId,
              feature_id: FEATURES.AI_CREDITS,
              value: 0,
            });

            if (error) {
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
              reason: contentResult.reason,
              lookbackWindow,
              repositoryCount: 1,
              source: "event",
            });
          } catch (trackingError) {
            console.error(
              "[Event] Failed to track content generation failure",
              {
                triggerId,
                organizationId: trigger.organizationId,
                error: trackingError,
              }
            );
          }
        });

        console.error(
          `[Event] Content generation failed for trigger ${triggerId}: ${contentResult.reason}`
        );
        await context.cancel();
        return;
      }

      const createdPosts = contentResult.posts;

      if (createdPosts.length === 0) {
        console.error("[Event] Content generation returned no posts", {
          triggerId,
          organizationId: trigger.organizationId,
        });
        await context.cancel();
        return;
      }

      const [primaryPost] = createdPosts;

      if (!primaryPost) {
        console.error("[Event] Missing primary post after generation", {
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
          console.error("[Event] Failed to track some created posts", {
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
            return;
          }

          const baseUrl =
            process.env.BETTER_AUTH_URL ?? "https://app.usenotra.com";
          const contentOverviewLink = `${baseUrl}/${notificationData.organizationSlug}/content`;
          const createdContent = createdPosts.map((createdPost) => ({
            title: createdPost.title,
            contentLink: `${contentOverviewLink}/${createdPost.postId}`,
          }));
          const triggerName = trigger.name.trim() || `${eventType} event`;

          await Promise.allSettled(
            notificationData.ownerEmails.map((email) =>
              sendScheduledContentCreatedEmail(resend, {
                recipientEmail: email,
                organizationName: notificationData.organizationName,
                scheduleName: triggerName,
                createdContent,
                contentType: trigger.outputType,
                contentOverviewLink,
                organizationSlug: notificationData.organizationSlug,
                subject: `New content created from ${eventType} event`,
              }).then((result) => {
                if (result.error) {
                  console.error(
                    `[Event] Failed to send notification to ${email}:`,
                    result.error
                  );
                }
              })
            )
          );
        });
      }

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
          const { error: refundError } = await autumnClient.track({
            customer_id: trigger.organizationId,
            feature_id: FEATURES.AI_CREDITS,
            value: 0,
          });

          if (refundError) {
            console.error("[Event] Failed to refund AI credit:", refundError);
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
        `[Event] Workflow failed for trigger ${context.requestPayload.triggerId}:`,
        { status: failStatus, response: failResponse }
      );
    },
  }
);
