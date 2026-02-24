import { generateEventContent } from "@/lib/ai/agents/event-content";
import type {
  EventGenerationContext,
  EventGenerationResult,
} from "@/types/lib/workflows/workflows";

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
    const { postId, title } = await generateEventContent({
      organizationId: ctx.organizationId,
      triggerId: ctx.triggerId,
      triggerName: ctx.triggerName,
      eventType: ctx.eventType,
      eventAction: ctx.eventAction,
      eventData: ctx.eventData,
      repositoryOwner: ctx.repositoryOwner,
      repositoryName: ctx.repositoryName,
      outputType: ctx.outputType,
      tone: ctx.tone,
      brand: ctx.brand,
      sourceMetadata: ctx.sourceMetadata,
    });

    return { status: "ok", postId, title };
  } catch (error) {
    return {
      status: "generation_failed",
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
