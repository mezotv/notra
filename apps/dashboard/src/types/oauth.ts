import type { OAUTH_SUPPORTED_SCOPES } from "@/constants/oauth";

export type OAuthScope = (typeof OAUTH_SUPPORTED_SCOPES)[number];

export interface OAuthAuthorizeRequest {
  responseType: "code";
  clientId: string;
  redirectUri: string;
  scope: string;
  state?: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
  resource: string;
}

export interface OAuthAuthorizationCodePayload {
  clientId: string;
  redirectUri: string;
  scope: string;
  codeChallenge: string;
  resource: string;
  userId: string;
  organizationId: string;
}

export interface OAuthRefreshTokenPayload {
  clientId: string;
  scope: string;
  resource: string;
  userId: string;
  organizationId: string;
}

export interface OAuthRegisteredClient {
  clientId: string;
  redirectUris: string[];
  clientName?: string;
  createdAt: string;
}

export interface OAuthAccessTokenPayload extends OAuthRefreshTokenPayload {
  jti: string;
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  typ: "access";
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope: string;
  refresh_token: string;
}
