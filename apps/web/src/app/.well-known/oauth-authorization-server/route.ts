import {
  PUBLIC_API_SCOPES,
  buildAgentAuthMetadata,
  siteUrl,
} from "@/utils/agent-metadata";
import { jsonResponse } from "@/utils/http";

export function GET() {
  return jsonResponse({
    issuer: siteUrl(),
    authorization_endpoint: siteUrl("/agent/auth/authorize"),
    token_endpoint: siteUrl("/agent/auth/token"),
    registration_endpoint: siteUrl("/agent/auth/register"),
    revocation_endpoint: siteUrl("/agent/auth/revoke"),
    response_types_supported: ["code"],
    grant_types_supported: [
      "authorization_code",
      "client_credentials",
      "urn:ietf:params:oauth:grant-type:token-exchange",
    ],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "none"],
    scopes_supported: PUBLIC_API_SCOPES,
    agent_auth: buildAgentAuthMetadata(),
  });
}
