import { markdownResponse } from "@/utils/markdown";
import { buildPricingMarkdown } from "@/utils/site-markdown";

export async function GET() {
  return markdownResponse(buildPricingMarkdown());
}
