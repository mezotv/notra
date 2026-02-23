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
import { getResend } from "@notra/email";
import type { WorkflowContext } from "@upstash/workflow";
import { WorkflowAbort } from "@upstash/workflow";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { generateChangelog } from "@/lib/ai/agents/changelog";
import { isGitHubRateLimitError } from "@/lib/ai/tools/github";
import { autumn } from "@/lib/billing/autumn";
import { trackScheduledContentCreated } from "@/lib/databuddy";
import {
  sendScheduledContentCreatedEmail,
  sendScheduledContentFailedEmail,
} from "@/lib/email/send";
import { getBaseUrl, triggerScheduleNow } from "@/lib/triggers/qstash";
import { appendWebhookLog } from "@/lib/webhooks/logging";
import { getValidToneProfile } from "@/schemas/brand";
import type { LookbackWindow } from "@/schemas/integrations";
import { FEATURES } from "@/utils/constants";

const schedulePayloadSchema = z.object({
  triggerId: z.string().min(1),
  manual: z.boolean().optional().default(false),
});

type SchedulePayload = z.infer<typeof schedulePayloadSchema>;

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

type ContentGenerationResult =
  | { status: "ok"; postId: string; title: string }
  | { status: "rate_limited"; retryAfterSeconds?: number }
  | { status: "unsupported_output_type"; outputType: string }
  | { status: "generation_failed"; reason: string };

type BrandSettingsData = {
  toneProfile: string | null;
  companyName: string | null;
  companyDescription: string | null;
  audience: string | null;
  customInstructions: string | null;
} | null;

const DEFAULT_LOOKBACK_WINDOW: LookbackWindow = "last_7_days";
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const GITHUB_RATE_LIMIT_RETRY_DELAY = "30m" as const;
function resolveLookbackRange(window: LookbackWindow) {
  const now = new Date();

  if (window === "current_day") {
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);

    return {
      start,
      end: now,
      label: "current UTC day",
    };
  }

  if (window === "yesterday") {
    const end = new Date(now);
    end.setUTCHours(0, 0, 0, 0);
    const start = new Date(end.getTime() - DAY_IN_MS);

    return {
      start,
      end,
      label: "previous UTC day",
    };
  }

  if (window === "last_14_days") {
    return {
      start: new Date(now.getTime() - 14 * DAY_IN_MS),
      end: now,
      label: "last 14 days (rolling)",
    };
  }

  if (window === "last_30_days") {
    return {
      start: new Date(now.getTime() - 30 * DAY_IN_MS),
      end: now,
      label: "last 30 days (rolling)",
    };
  }

  return {
    start: new Date(now.getTime() - 7 * DAY_IN_MS),
    end: now,
    label: "last 7 days (rolling)",
  };
}

function formatUtcTodayContext(now: Date) {
  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ] as const;
  const weekday = weekdays[now.getUTCDay()];
  const date = now.toISOString().slice(0, 10);

  return `${weekday}, ${date} (UTC)`;
}

export const { POST } = serve<SchedulePayload>(
  async (context: WorkflowContext<SchedulePayload>) => {
    const parseResult = schedulePayloadSchema.safeParse(context.requestPayload);
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

        return {
          id: result.id,
          name: result.name,
          organizationId: result.organizationId,
          sourceType: result.sourceType,
          sourceConfig: result.sourceConfig,
          targets: result.targets as { repositoryIds: string[] },
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

        return (
          (lookbackResult?.window as LookbackWindow | undefined) ??
          DEFAULT_LOOKBACK_WINDOW
        );
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

    // Step 3: Generate content based on output type
    try {
      const contentResult = await context.run<ContentGenerationResult>(
        "generate-content",
        async () => {
          if (trigger.outputType === "changelog") {
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
            };

            try {
              const { postId, title } = await generateChangelog({
                organizationId: trigger.organizationId,
                repositories: repositories.map((repository) => ({
                  integrationId: repository.id,
                  owner: repository.owner,
                  repo: repository.repo,
                  defaultBranch: repository.defaultBranch,
                })),
                tone: getValidToneProfile(brand?.toneProfile, "Conversational"),
                promptInput: {
                  sourceTargets: repoList,
                  todayUtc,
                  lookbackLabel: lookbackRange.label,
                  lookbackStartIso: lookbackRange.start.toISOString(),
                  lookbackEndIso: lookbackRange.end.toISOString(),
                  companyName: brand?.companyName ?? undefined,
                  companyDescription: brand?.companyDescription ?? undefined,
                  audience: brand?.audience ?? undefined,
                  customInstructions: brand?.customInstructions ?? null,
                },
                sourceMetadata,
              });

              return {
                status: "ok",
                postId,
                title,
              };
            } catch (error) {
              if (isGitHubRateLimitError(error)) {
                return {
                  status: "rate_limited",
                  retryAfterSeconds: error.retryAfterSeconds,
                };
              }

              return {
                status: "generation_failed",
                reason: error instanceof Error ? error.message : String(error),
              };
            }
          }

          // For other output types, return a distinct status so we do not
          // enter rate-limit retry flow.
          console.log(
            `[Schedule] Output type ${trigger.outputType} not fully implemented yet`
          );
          return {
            status: "unsupported_output_type",
            outputType: trigger.outputType,
          };
        }
      );

      if (contentResult.status === "rate_limited") {
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

        await context.run("log-generation-failure", async () => {
          await appendWebhookLog({
            organizationId: trigger.organizationId,
            integrationId: triggerId,
            integrationType: "schedule",
            title: `Schedule "${trigger.name.trim() || trigger.outputType}" failed to generate content`,
            status: "failed",
            statusCode: null,
            errorMessage: contentResult.reason,
          });
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

      const { postId, title: contentTitle } = contentResult;

      await context.run("log-generation-success", async () => {
        await appendWebhookLog({
          organizationId: trigger.organizationId,
          integrationId: triggerId,
          integrationType: "schedule",
          title: `Schedule "${trigger.name.trim() || trigger.outputType}" created "${contentTitle}"`,
          status: "success",
          statusCode: null,
          referenceId: postId,
        });
      });

      await context.run("track-content-created", async () => {
        try {
          await trackScheduledContentCreated({
            triggerId: trigger.id,
            organizationId: trigger.organizationId,
            postId,
            outputType: trigger.outputType,
            lookbackWindow,
            repositoryCount: repositories.length,
          });
        } catch (trackingError) {
          console.error("[Schedule] Failed to track content creation", {
            triggerId,
            organizationId: trigger.organizationId,
            postId,
            error: trackingError,
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
          const contentLink = `${baseUrl}/${notificationData.organizationSlug}/content/${postId}`;
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
                contentTitle,
                contentType: trigger.outputType,
                contentLink,
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
          `[Schedule] Created post ${postId} for trigger ${triggerId}`
        );
      }

      return { success: true, triggerId, postId };
    } catch (error) {
      if (error instanceof WorkflowAbort) {
        throw error;
      }

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
