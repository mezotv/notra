import { PUBLIC_API_SCOPES, apiUrl, siteUrl } from "@/utils/agent-metadata";
import { jsonResponse } from "@/utils/http";

export function GET() {
  return jsonResponse({
    resource: apiUrl(),
    authorization_servers: [
      siteUrl("/.well-known/oauth-authorization-server"),
    ],
    scopes_supported: PUBLIC_API_SCOPES,
    bearer_methods_supported: ["header"],
    resource_documentation: siteUrl("/auth.md"),
  });
}
