import type { ScheduleOutputType } from "@/schemas/integrations";
import type {
  ContentGenerationContext,
  ContentGenerationResult,
  ContentHandler,
} from "../types";
import { handleBlogPost } from "./blog-post";
import { handleChangelog } from "./changelog";
import { handleLinkedIn } from "./linkedin";
import { handleTwitter } from "./twitter";

const handlers: Record<ScheduleOutputType, ContentHandler> = {
  changelog: handleChangelog,
  blog_post: handleBlogPost,
  linkedin_post: handleLinkedIn,
  twitter_post: handleTwitter,
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
