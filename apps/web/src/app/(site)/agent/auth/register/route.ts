import { buildAgentAuthMetadata } from "@/utils/agent-metadata";
import { jsonResponse } from "@/utils/http";

export function OPTIONS() {
  return new Response(null, { status: 204 });
}

export function POST() {
  return jsonResponse({
    status: "registration_required",
    message:
      "Create Notra API keys in the dashboard. This endpoint is discoverable for agent auth metadata and does not issue credentials automatically.",
    agent_auth: buildAgentAuthMetadata(),
  });
}
