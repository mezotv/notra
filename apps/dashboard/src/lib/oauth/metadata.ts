import {
  OAUTH_AUTHORIZATION_CODE_GRANT,
  OAUTH_CODE_CHALLENGE_METHOD,
  OAUTH_REFRESH_TOKEN_GRANT,
  OAUTH_SUPPORTED_SCOPES,
} from "@/constants/oauth";

const TRAILING_SLASH_REGEX = /\/$/;

export function getOAuthIssuer() {
  const issuer = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL;

  if (!issuer) {
    throw new Error("BETTER_AUTH_URL or NEXT_PUBLIC_APP_URL must be defined");
  }

  return issuer.replace(TRAILING_SLASH_REGEX, "");
}

export function buildOAuthAuthorizationServerMetadata() {
  const issuer = getOAuthIssuer();

  return {
    issuer,
    authorization_endpoint: `${issuer}/agent/auth/authorize`,
    token_endpoint: `${issuer}/agent/auth/token`,
    registration_endpoint: `${issuer}/agent/auth/register`,
    revocation_endpoint: `${issuer}/agent/auth/revoke`,
    response_types_supported: ["code"],
    grant_types_supported: [
      OAUTH_AUTHORIZATION_CODE_GRANT,
      OAUTH_REFRESH_TOKEN_GRANT,
    ],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: [OAUTH_CODE_CHALLENGE_METHOD],
    scopes_supported: OAUTH_SUPPORTED_SCOPES,
    resource_parameter_supported: true,
  };
}
