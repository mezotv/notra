import { markdownResponse } from "@/utils/markdown";
import { buildFeaturesMarkdown } from "@/utils/site-markdown";

export async function GET() {
  return markdownResponse(buildFeaturesMarkdown());
}
