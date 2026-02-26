import { generateChangelog } from "@/lib/ai/agents/changelog";
import { generateLinkedInPost } from "@/lib/ai/agents/linkedin";
import type {
  EventGenerationContext,
  EventGenerationResult,
} from "@/types/lib/workflows/workflows";

function resolveEventRange(eventData: Record<string, unknown>) {
  const candidates: unknown[] = [];

  if ("publishedAt" in eventData) {
    candidates.push(eventData.publishedAt);
  }
  if ("triggeredAt" in eventData) {
    candidates.push(eventData.triggeredAt);
  }
  if ("starredAt" in eventData) {
    candidates.push(eventData.starredAt);
  }
  if ("commits" in eventData && Array.isArray(eventData.commits)) {
    for (const commit of eventData.commits) {
      if (commit && typeof commit === "object" && "timestamp" in commit) {
        candidates.push((commit as { timestamp?: unknown }).timestamp);
      }
    }
  }

  const parsedDates = candidates
    .filter((value): value is string => typeof value === "string")
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()));

  const end =
    parsedDates.length > 0
      ? new Date(Math.max(...parsedDates.map((date) => date.getTime())))
      : new Date();
  const start = new Date(end.getTime() - 60 * 60 * 1000);

  return { start, end };
}

function buildEventPromptInput(ctx: EventGenerationContext) {
  const { start, end } = resolveEventRange(ctx.eventData);

  const eventContextJson = JSON.stringify(
    {
      eventType: ctx.eventType,
      eventAction: ctx.eventAction,
      eventData: ctx.eventData,
    },
    null,
    2
  );

  const eventInstructions = `Event context (highest priority for this run):\n${eventContextJson}`;

  return {
    sourceTargets: `${ctx.repositoryOwner}/${ctx.repositoryName} (${ctx.eventType}.${ctx.eventAction})`,
    todayUtc: end.toISOString().slice(0, 10),
    lookbackLabel: `event ${ctx.eventType}.${ctx.eventAction}`,
    lookbackStartIso: start.toISOString(),
    lookbackEndIso: end.toISOString(),
    companyName: ctx.brand.companyName,
    companyDescription: ctx.brand.companyDescription,
    audience: ctx.brand.audience,
    customInstructions: ctx.brand.customInstructions
      ? `${ctx.brand.customInstructions}\n\n${eventInstructions}`
      : eventInstructions,
  };
}

export async function generateEventBasedContent(
  ctx: EventGenerationContext
): Promise<EventGenerationResult> {
  const { outputType } = ctx;

  const supportedTypes = ["changelog", "linkedin_post"];
  if (!supportedTypes.includes(outputType)) {
    return {
      status: "unsupported_output_type",
      outputType,
    };
  }

  try {
    const repositories = [
      {
        integrationId: ctx.repositoryId,
        owner: ctx.repositoryOwner,
        repo: ctx.repositoryName,
        defaultBranch: null,
      },
    ];

    const promptInput = buildEventPromptInput(ctx);

    const result =
      outputType === "changelog"
        ? await generateChangelog({
            organizationId: ctx.organizationId,
            repositories,
            tone: ctx.tone,
            promptInput,
            sourceMetadata: ctx.sourceMetadata,
          })
        : await generateLinkedInPost({
            organizationId: ctx.organizationId,
            repositories,
            tone: ctx.tone,
            promptInput,
            sourceMetadata: ctx.sourceMetadata,
          });

    return { status: "ok", postId: result.postId, title: result.title };
  } catch (error) {
    return {
      status: "generation_failed",
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
