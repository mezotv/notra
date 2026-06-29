import { markdownResponse } from "@/utils/http";

const AUTH_MD = `# Notra Agent Authentication

Notra exposes an authenticated API and MCP server for agents that generate, read, and manage product content. Use this guide to discover the supported auth metadata, request an OAuth or API-key credential, and recover from common errors.

## Discover

Start at \`/.well-known/agent.json\`, \`/.well-known/agent-card.json\`, and \`/.well-known/api-catalog\`. The API resource server is \`https://api.usenotra.com\`, and its protected resource metadata is published at \`https://api.usenotra.com/.well-known/oauth-protected-resource\`. The MCP resource server is \`https://mcp.usenotra.com\`, and its protected resource metadata is published at \`https://mcp.usenotra.com/.well-known/oauth-protected-resource\`. Unauthenticated API and MCP requests return a \`WWW-Authenticate\` header with a \`resource_metadata\` URL.

## Pick a method

OAuth-capable clients should follow the authorization server advertised by the protected resource metadata. The production authorization server is \`https://app.usenotra.com\`, with authorization, token, registration, and revocation endpoints under \`/agent/auth/*\`. Manual clients can use API keys created in the Notra dashboard.

## Register

Call \`POST https://app.usenotra.com/agent/auth/register\` for dynamic OAuth client registration. Agents should request the least privileged resource scopes, such as \`posts.read\`, \`posts.write\`, \`skills.read\`, \`skills.write\`, \`integrations.read\`, and \`integrations.write\`.

## Claim

Call \`POST /agent/auth/claim\` to check the claim endpoint shape. It returns manual-approval guidance until automatic credential issuance is enabled. Browser-only challenges and CAPTCHAs are not required for API-key use.

## Use the credential

Send the credential as \`Authorization: Bearer <TOKEN>\`. For MCP clients that support OAuth discovery, start at \`https://mcp.usenotra.com/.well-known/oauth-protected-resource\`; for manual clients, use a Notra API key as the bearer credential when connecting to \`https://mcp.usenotra.com/mcp\`.

## Errors

401 responses include \`WWW-Authenticate: Bearer resource_metadata="https://api.usenotra.com/.well-known/oauth-protected-resource"\`. Error bodies keep the backward-compatible \`error\` string and may include sibling \`code\` and \`recovery\` fields. If a request is rate limited, respect \`Retry-After\`.

## Revocation

Call \`POST https://app.usenotra.com/agent/auth/revoke\` for OAuth tokens, or revoke API keys in the Notra dashboard. Agents should discard revoked credentials immediately and repeat discovery before requesting a replacement.
`;

export function GET() {
  return markdownResponse(AUTH_MD);
}
