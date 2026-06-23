import { buildAgentAuthMetadata } from "@/utils/agent-metadata";
import { jsonResponse } from "@/utils/http";

export function OPTIONS() {
  return new Response(null, { status: 204 });
}

export function POST() {
  return jsonResponse({
    status: "registration_required",
    message:
      "Create production API keys in the Notra dashboard or claim a scoped test credential through the documented agent_auth flow.",
    agent_auth: buildAgentAuthMetadata(),
  });
}
