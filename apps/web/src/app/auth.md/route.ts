import { markdownResponse } from "@/utils/http";

const AUTH_MD = `# Notra Agent Authentication

Notra exposes an authenticated API and MCP server for agents that generate, read, and manage product content. Use this guide to discover the supported auth metadata, request an API credential, and recover from common errors.

## Discover

Start at \`/.well-known/agent.json\`, \`/.well-known/agent-card.json\`, and \`/.well-known/api-catalog\`. The API resource server is \`https://api.usenotra.com\`, and its protected resource metadata is published at \`https://api.usenotra.com/.well-known/oauth-protected-resource\`. Unauthenticated API requests return a \`WWW-Authenticate\` header with a \`resource_metadata\` URL.

## Pick a method

The \`agent_auth\` block supports \`anonymous\` API-key registration for test or sandbox probes and \`identity_assertion\` for agents that can prove a user or workspace identity. For identity assertions, Notra accepts verified email claims and \`urn:ietf:params:oauth:token-type:id-jag\` assertions when configured for the organization.

## Register

Call \`POST /agent/auth/register\` to discover the shape of a registration request. Human-managed production API keys can also be created in the Notra dashboard. Agents should request the least privileged scopes: \`api.read\` for reads, \`posts.write\` for content updates, and \`skills.write\` only when modifying reusable writing skills.

## Claim

Call \`POST /agent/auth/claim\` with either an anonymous registration token or an \`identity_assertion\` payload. A successful claim returns credential metadata. Browser-only challenges and CAPTCHAs are not required for API-key use.

## Use the credential

Send the credential as \`Authorization: Bearer <NOTRA_API_KEY>\`. Mutating requests should include \`Idempotency-Key\` so retries do not create duplicate content. For MCP, use the same bearer credential when connecting to \`https://mcp.usenotra.com/mcp\`.

## Errors

401 responses include \`WWW-Authenticate: Bearer resource_metadata="https://api.usenotra.com/.well-known/oauth-protected-resource"\`. Error bodies include \`error.code\`, \`error.message\`, and \`error.recovery\` fields. If a request is rate limited, respect \`Retry-After\`.

## Revocation

Call \`POST /agent/auth/revoke\` or revoke the API key in the Notra dashboard. Agents should discard revoked credentials immediately and repeat discovery before requesting a replacement.
`;

export function GET() {
  return markdownResponse(AUTH_MD);
}
