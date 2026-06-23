import { apiUrl, siteUrl } from "@/utils/agent-metadata";
import { jsonResponse } from "@/utils/http";

export function GET() {
  return jsonResponse({
    status: "ok",
    service: "Notra API discovery",
    public: true,
    production_status: apiUrl("/v1/status"),
    openapi: apiUrl("/openapi.json"),
    authentication: {
      type: "bearer",
      resource_metadata: apiUrl("/.well-known/oauth-protected-resource"),
      guide: siteUrl("/auth.md"),
    },
  });
}
