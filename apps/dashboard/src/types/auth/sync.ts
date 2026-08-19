import type { User } from "@workos-inc/node";

export interface OAuthProviderTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  scopes?: string[];
}

export interface SyncAuthenticatedUserInput {
  workosUser: User;
  oauthTokens?: OAuthProviderTokens;
  authenticationMethod?: string;
}
