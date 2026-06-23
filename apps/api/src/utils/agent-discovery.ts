export const API_URL = "https://api.usenotra.com";
export const SITE_URL = "https://www.usenotra.com";

export const RESOURCE_METADATA_URL = `${API_URL}/.well-known/oauth-protected-resource`;
export const AUTH_GUIDE_URL = `${SITE_URL}/auth.md`;

const PUBLIC_API_SCOPES = [
  "api.read",
  "api.write",
  "posts.read",
  "posts.write",
  "skills.read",
  "skills.write",
] as const;

const AGENT_AUTH_METADATA = {
  register_uri: `${SITE_URL}/agent/auth/register`,
  claim_uri: `${SITE_URL}/agent/auth/claim`,
  revocation_uri: `${SITE_URL}/agent/auth/revoke`,
  skill: AUTH_GUIDE_URL,
  identity_types_supported: ["anonymous", "identity_assertion"],
  anonymous: {
    credential_types_supported: ["api_key"],
  },
  identity_assertion: {
    assertion_types_supported: [
      "verified_email",
      "urn:ietf:params:oauth:token-type:id-jag",
    ],
    credential_types_supported: ["api_key", "bearer"],
  },
} as const;

export function buildProtectedResourceMetadata() {
  return {
    resource: API_URL,
    authorization_servers: [SITE_URL],
    scopes_supported: PUBLIC_API_SCOPES,
    bearer_methods_supported: ["header"],
    resource_documentation: AUTH_GUIDE_URL,
  };
}

export function buildAuthorizationServerMetadata() {
  return {
    issuer: SITE_URL,
    authorization_endpoint: `${SITE_URL}/agent/auth/authorize`,
    token_endpoint: `${SITE_URL}/agent/auth/token`,
    registration_endpoint: `${SITE_URL}/agent/auth/register`,
    revocation_endpoint: `${SITE_URL}/agent/auth/revoke`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: PUBLIC_API_SCOPES,
    agent_auth: AGENT_AUTH_METADATA,
  };
}
