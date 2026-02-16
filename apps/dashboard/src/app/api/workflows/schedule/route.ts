import { db } from "@notra/db/drizzle";
import type { PostSourceMetadata } from "@notra/db/schema";
import {
  brandSettings,
  contentTriggerLookbackWindows,
  contentTriggers,
  githubIntegrations,
  posts,
} from "@notra/db/schema";
import type { WorkflowContext } from "@upstash/workflow";
import { serve } from "@upstash/workflow/nextjs";
import { eq, inArray } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { generateChangelog } from "@/lib/ai/agents/changelog";
import { isGitHubRateLimitError } from "@/lib/ai/tools/github";
import { autumn } from "@/lib/billing/autumn";
import { trackScheduledContentCreated } from "@/lib/databuddy";
import { getBaseUrl, triggerScheduleNow } from "@/lib/triggers/qstash";
import { getValidToneProfile } from "@/schemas/brand";
import type { LookbackWindow } from "@/schemas/integrations";
import { FEATURES } from "@/utils/constants";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

const schedulePayloadSchema = z.object({
  triggerId: z.string().min(1),
});

type SchedulePayload = z.infer<typeof schedulePayloadSchema>;

interface TriggerData {
  id: string;
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
}

interface GeneratedContent {
  title: string;
  markdown: string;
}

type ContentGenerationResult =
  | { status: "ok"; content: GeneratedContent }
  | { status: "rate_limited"; retryAfterSeconds?: number };

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
    const { triggerId } = parseResult.data;

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
              .map((r) => `${r.owner}/${r.repo}`)
              .join(", ");

            try {
              const { output } = await generateChangelog({
                organizationId: trigger.organizationId,
                repositories: repositories.map((repository) => ({
                  owner: repository.owner,
                  repo: repository.repo,
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
              });

              return {
                status: "ok",
                content: {
                  title: output.title,
                  markdown: output.markdown,
                },
              };
            } catch (error) {
              if (isGitHubRateLimitError(error)) {
                return {
                  status: "rate_limited",
                  retryAfterSeconds: error.retryAfterSeconds,
                };
              }

              throw error;
            }
          }

          // For other output types, log and return placeholder
          console.log(
            `[Schedule] Output type ${trigger.outputType} not fully implemented yet`
          );

          return {
            status: "ok",
            content: {
              title: `${trigger.outputType} - ${new Date().toLocaleDateString()}`,
              markdown: `*Automated ${trigger.outputType} generation is coming soon.*\n\nRepositories: ${repositories.map((r) => `${r.owner}/${r.repo}`).join(", ")}`,
            },
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
              value: -1,
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

      const content = contentResult.content;

      const postId = await context.run<string>("save-post", async () => {
        const id = nanoid();
        const lookbackRange = resolveLookbackRange(lookbackWindow);

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

        await db.insert(posts).values({
          id,
          organizationId: trigger.organizationId,
          title: content.title,
          content: content.markdown,
          markdown: content.markdown,
          contentType: trigger.outputType,
          sourceMetadata,
        });

        return id;
      });

      await context.run("track-content-created", async () => {
        await trackScheduledContentCreated({
          triggerId: trigger.id,
          organizationId: trigger.organizationId,
          postId,
          outputType: trigger.outputType,
          lookbackWindow,
          repositoryCount: repositories.length,
        });
      });

      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Schedule] Created post ${postId} for trigger ${triggerId}`
        );
      }

      return { success: true, triggerId, postId };
    } catch (error) {
      const autumnClient = autumn;
      if (aiCreditReservation.reserved && autumnClient) {
        await context.run("refund-ai-credit-after-failure", async () => {
          const { error: refundError } = await autumnClient.track({
            customer_id: trigger.organizationId,
            feature_id: FEATURES.AI_CREDITS,
            value: -1,
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
