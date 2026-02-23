import type { ScheduleOutputType } from "@/schemas/integrations";
import type {
  ContentGenerationContext,
  ContentGenerationResult,
  ContentHandler,
} from "../types";
import { handleChangelog } from "./changelog";
import { handleLinkedIn } from "./linkedin";

const handlers: Record<ScheduleOutputType, ContentHandler> = {
  changelog: handleChangelog,
  linkedin_post: handleLinkedIn,
};

export async function generateScheduledContent(
  outputType: string,
  ctx: ContentGenerationContext
): Promise<ContentGenerationResult> {
  const handler = handlers[outputType as ScheduleOutputType];

  if (!handler) {
    console.log(
      `[Schedule] Output type ${outputType} not fully implemented yet`
    );
    return {
      status: "unsupported_output_type",
      outputType,
    };
  }

  return handler(ctx);
}
