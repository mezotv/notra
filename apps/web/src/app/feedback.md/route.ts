import { buildNotraFeedbackMarkdown } from "@/lib/feedback-md/markdown";
import { markdownResponse } from "@/utils/http";

export function GET() {
  return markdownResponse(buildNotraFeedbackMarkdown());
}
