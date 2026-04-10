import { buildLlmsText } from "@/utils/llms";
import { textResponse } from "@/utils/markdown";

export async function GET() {
  return textResponse(await buildLlmsText());
}
