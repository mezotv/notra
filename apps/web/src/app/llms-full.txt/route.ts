import { buildLlmsFullText } from "@/utils/llms";
import { textResponse } from "@/utils/markdown";

export async function GET() {
  return textResponse(await buildLlmsFullText());
}
