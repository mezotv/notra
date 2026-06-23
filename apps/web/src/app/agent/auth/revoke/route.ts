import { jsonResponse } from "@/utils/http";

export function OPTIONS() {
  return new Response(null, { status: 204 });
}

export function POST() {
  return jsonResponse({
    status: "accepted",
    message:
      "Revoke Notra API keys from the dashboard. Agents should discard the credential and repeat discovery before reconnecting.",
  });
}
