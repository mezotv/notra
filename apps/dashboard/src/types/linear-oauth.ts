export interface LinearTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in?: number;
}

export interface LinearOrganizationResponse {
  id: string;
  name: string;
}

export interface LinearOAuthState {
  organizationId: string;
  userId: string;
  callbackPath: string;
}
