import { jsonResponse } from "@/utils/http";

export function OPTIONS() {
  return new Response(null, { status: 204 });
}

export function POST() {
  return jsonResponse({
    status: "manual_approval_required",
    credential_types_supported: ["api_key", "bearer"],
    message:
      "Notra agent credentials are issued from the dashboard today. Use /auth.md and the OpenAPI schema to request the required scopes.",
  });
}
