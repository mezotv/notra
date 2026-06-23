import { buildProtectedResourceMetadata } from "@/utils/agent-metadata";
import { jsonResponse } from "@/utils/http";

export function GET() {
  return jsonResponse(buildProtectedResourceMetadata());
}
