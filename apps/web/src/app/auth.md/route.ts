import { markdownResponse } from "@/utils/http";

const AUTH_MD = `# Notra Agent Authentication

Notra exposes an authenticated API and MCP server for agents that generate, read, and manage product content. Use this guide to discover the supported auth metadata, request an API credential, and recover from common errors.

## Discover

Start at \`/.well-known/agent.json\`, \`/.well-known/agent-card.json\`, and \`/.well-known/api-catalog\`. The API resource server is \`https://api.usenotra.com\`, and its protected resource metadata is published at \`https://api.usenotra.com/.well-known/oauth-protected-resource\`. The MCP resource server is \`https://mcp.usenotra.com\`, and its protected resource metadata is published at \`https://mcp.usenotra.com/.well-known/oauth-protected-resource\`. Unauthenticated API and MCP requests return a \`WWW-Authenticate\` header with a \`resource_metadata\` URL.

## Pick a method

The \`agent_auth\` block documents \`anonymous\` and \`identity_assertion\` request shapes for agents. Notra currently issues API keys through the dashboard rather than an automatic OAuth token exchange. For identity assertions, Notra accepts verified email claims and \`urn:ietf:params:oauth:token-type:id-jag\` assertions when configured for the organization.

## Register

Call \`POST /agent/auth/register\` to confirm the supported registration metadata. Production API keys are created in the Notra dashboard. Agents should request the least privileged scopes: \`api.read\` for reads, \`posts.write\` for content updates, and \`skills.write\` only when modifying reusable writing skills.

## Claim

Call \`POST /agent/auth/claim\` to check the claim endpoint shape. It returns manual-approval guidance until automatic credential issuance is enabled. Browser-only challenges and CAPTCHAs are not required for API-key use.

## Use the credential

Send the credential as \`Authorization: Bearer <NOTRA_API_KEY>\`. For MCP clients that support OAuth discovery, start at \`https://mcp.usenotra.com/.well-known/oauth-protected-resource\`; for manual clients, use the same bearer credential when connecting to \`https://mcp.usenotra.com/mcp\`.

## Errors

401 responses include \`WWW-Authenticate: Bearer resource_metadata="https://api.usenotra.com/.well-known/oauth-protected-resource"\`. Error bodies keep the backward-compatible \`error\` string and may include sibling \`code\` and \`recovery\` fields. If a request is rate limited, respect \`Retry-After\`.

## Revocation

Call \`POST /agent/auth/revoke\` or revoke the API key in the Notra dashboard. Agents should discard revoked credentials immediately and repeat discovery before requesting a replacement.
`;

export function GET() {
  return markdownResponse(AUTH_MD);
}
