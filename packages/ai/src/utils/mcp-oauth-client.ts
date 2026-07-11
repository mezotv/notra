import type {
  OAuthClientInformationMixed,
  OAuthClientMetadata,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import {
  MCP_OAUTH_CLIENT_NAME,
  MCP_OAUTH_CLIENT_URI,
} from "../constants/mcp-auth";

export function createMcpOAuthClientMetadata(
  redirectUrl: string,
  scope?: string
): OAuthClientMetadata {
  return {
    client_name: MCP_OAUTH_CLIENT_NAME,
    client_uri: MCP_OAUTH_CLIENT_URI,
    grant_types: ["authorization_code", "refresh_token"],
    redirect_uris: [redirectUrl],
    response_types: ["code"],
    scope,
  };
}

export function isMcpOAuthClientRegistrationExpired(
  clientInformation: OAuthClientInformationMixed
) {
  return (
    "client_secret_expires_at" in clientInformation &&
    typeof clientInformation.client_secret_expires_at === "number" &&
    clientInformation.client_secret_expires_at !== 0 &&
    clientInformation.client_secret_expires_at * 1000 <= Date.now()
  );
}
