import { db } from "@notra/db/drizzle";
import type { PostSourceMetadata } from "@notra/db/schema";
import {
  brandSettings,
  contentTriggers,
  githubIntegrations,
  members,
  organizationNotificationSettings,
  organizations,
} from "@notra/db/schema";
import { getResend } from "@notra/email";
import type { WorkflowContext } from "@upstash/workflow";
import { WorkflowAbort } from "@upstash/workflow";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";
import { FEATURES } from "@/constants/features";
import { autumn } from "@/lib/billing/autumn";
import { checkLogRetention } from "@/lib/billing/check-log-retention";
import { sendScheduledContentCreatedEmail } from "@/lib/email/send";
import { getBaseUrl } from "@/lib/triggers/qstash";
import { appendWebhookLog } from "@/lib/webhooks/logging";
import { generateEventBasedContent } from "@/lib/workflows/event/handlers";
import { getValidToneProfile } from "@/schemas/brand";
import {
  type EventWorkflowPayload,
  eventWorkflowPayloadSchema,
} from "@/schemas/workflows";
import type { LogRetentionDays } from "@/types/lib/webhooks/webhooks";
import type {
  EventGenerationResult,
  WorkflowBrandSettings,
  WorkflowRepositoryData,
  WorkflowTriggerData,
} from "@/types/lib/workflows/workflows";

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
        const result = await db.query.brandSettings.findFirst({
          where: eq(brandSettings.organizationId, trigger.organizationId),
        });

        if (!result) {
          return null;
        }

        return {
          toneProfile: result.toneProfile,
          companyName: result.companyName,
          companyDescription: result.companyDescription,
          audience: result.audience,
          customInstructions: result.customInstructions,
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

    try {
      const sourceMetadata: PostSourceMetadata = {
        triggerId: trigger.id,
        triggerSourceType: "github_webhook",
        eventType,
        eventAction,
        repositories: [{ owner: repository.owner, repo: repository.name }],
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
            integrationType: "webhook",
            title: `Event "${trigger.name.trim() || eventType}" failed to generate content`,
            status: "failed",
            statusCode: null,
            errorMessage: contentResult.reason,
            retentionDays: logRetentionDays,
          });
        });

        console.error(
          `[Event] Content generation failed for trigger ${triggerId}: ${contentResult.reason}`
        );
        await context.cancel();
        return;
      }

      const { postId, title: contentTitle } = contentResult;

      await context.run("log-generation-success", async () => {
        await appendWebhookLog({
          organizationId: trigger.organizationId,
          integrationId: triggerId,
          integrationType: "webhook",
          title: `Event "${trigger.name.trim() || eventType}" created "${contentTitle}"`,
          status: "success",
          statusCode: null,
          referenceId: postId,
          retentionDays: logRetentionDays,
        });
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
          const contentLink = `${baseUrl}/${notificationData.organizationSlug}/content/${postId}`;
          const triggerName = trigger.name.trim() || `${eventType} event`;

          await Promise.allSettled(
            notificationData.ownerEmails.map((email) =>
              sendScheduledContentCreatedEmail(resend, {
                recipientEmail: email,
                organizationName: notificationData.organizationName,
                scheduleName: triggerName,
                contentTitle,
                contentType: trigger.outputType,
                contentLink,
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
