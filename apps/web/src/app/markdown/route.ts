import { markdownResponse } from "@/utils/markdown";
import { buildLandingMarkdown } from "@/utils/site-markdown";

export async function GET() {
  return markdownResponse(buildLandingMarkdown());
}
