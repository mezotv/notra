import { db } from "@notra/db/drizzle";
import type { PostSourceMetadata } from "@notra/db/schema";
import {
  brandSettings,
  contentTriggerLookbackWindows,
  contentTriggers,
  githubIntegrations,
  githubRepositories,
  posts,
} from "@notra/db/schema";
import type { WorkflowContext } from "@upstash/workflow";
import { serve } from "@upstash/workflow/nextjs";
import { eq, inArray } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { generateChangelog } from "@/lib/ai/agents/changelog";
import { getValidToneProfile } from "@/lib/ai/prompts/changelog/base";
import { getBaseUrl } from "@/lib/triggers/qstash";
import type { LookbackWindow } from "@/utils/schemas/integrations";

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
  integrationId: string;
}

interface GeneratedContent {
  title: string;
  markdown: string;
}

type BrandSettingsData = {
  toneProfile: string | null;
  companyName: string | null;
  companyDescription: string | null;
  audience: string | null;
  customInstructions: string | null;
} | null;

const DEFAULT_LOOKBACK_WINDOW: LookbackWindow = "last_7_days";
const DAY_IN_MS = 24 * 60 * 60 * 1000;

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
            id: githubRepositories.id,
            owner: githubRepositories.owner,
            repo: githubRepositories.repo,
            integrationId: githubRepositories.integrationId,
          })
          .from(githubRepositories)
          .innerJoin(
            githubIntegrations,
            eq(githubRepositories.integrationId, githubIntegrations.id)
          )
          .where(inArray(githubRepositories.id, repositoryIds));

        return repos;
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

    // Step 3: Generate content based on output type
    const content = await context.run<GeneratedContent>(
      "generate-content",
      async () => {
        if (trigger.outputType === "changelog") {
          const lookbackRange = resolveLookbackRange(lookbackWindow);
          const todayUtc = formatUtcTodayContext(lookbackRange.end);
          const repoList = repositories
            .map((r) => `${r.owner}/${r.repo}`)
            .join(", ");

          const { output } = await generateChangelog(
            {
              organizationId: trigger.organizationId,
              tone: getValidToneProfile(brand?.toneProfile, "Conversational"),
              companyName: brand?.companyName ?? undefined,
              companyDescription: brand?.companyDescription ?? undefined,
              audience: brand?.audience ?? undefined,
              customInstructions: brand?.customInstructions ?? undefined,
            },
            `Generate a changelog for the following repositories: ${repoList}. Today is ${todayUtc}. Look at commits in the ${lookbackRange.label} window (${lookbackRange.start.toISOString()} to ${lookbackRange.end.toISOString()}, UTC) and create a comprehensive, human-readable changelog.`
          );

          return {
            title: output.title,
            markdown: output.markdown,
          };
        }

        // For other output types, log and return placeholder
        console.log(
          `[Schedule] Output type ${trigger.outputType} not fully implemented yet`
        );

        return {
          title: `${trigger.outputType} - ${new Date().toLocaleDateString()}`,
          markdown: `*Automated ${trigger.outputType} generation is coming soon.*\n\nRepositories: ${repositories.map((r) => `${r.owner}/${r.repo}`).join(", ")}`,
        };
      }
    );

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

    console.log(`[Schedule] Created post ${postId} for trigger ${triggerId}`);

    return { success: true, triggerId, postId };
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
