import type {
  OAuthAuthorizationServerInformation,
  OAuthClientInformation,
  OAuthClientProvider,
  OAuthTokens,
} from "@ai-sdk/mcp";
import { assertPublicHttpUrlResolution } from "@notra/utils/url";
import {
  MCP_OAUTH_CLIENT_NAME,
  MCP_OAUTH_CLIENT_URI,
} from "../constants/mcp-auth";
import { mcpOAuthScopesMetadataSchema } from "../schemas/mcp-oauth";
import type {
  McpOAuthProviderPersistence,
  McpOAuthProviderState,
} from "../types/mcp-oauth";

interface CreateMcpOAuthProviderOptions {
  onRedirect: (authorizationUrl: URL) => void | Promise<void>;
  persistence?: McpOAuthProviderPersistence;
  redirectUrl: string;
  state: McpOAuthProviderState;
}

export function createMcpOAuthProvider({
  onRedirect,
  persistence,
  redirectUrl,
  state: initialState,
}: CreateMcpOAuthProviderOptions): OAuthClientProvider {
  const state = { ...initialState };

  return {
    redirectUrl,
    clientMetadata: {
      client_name: MCP_OAUTH_CLIENT_NAME,
      client_uri: MCP_OAUTH_CLIENT_URI,
      grant_types: ["authorization_code", "refresh_token"],
      redirect_uris: [redirectUrl],
      response_types: ["code"],
    },
    authorizationServerInformation() {
      return state.authorizationServerInformation;
    },
    async saveAuthorizationServerInformation(
      information: OAuthAuthorizationServerInformation
    ) {
      state.authorizationServerInformation = information;
      await persistence?.saveAuthorizationServerInformation?.(information);
    },
    clientInformation() {
      return state.clientInformation;
    },
    async saveClientInformation(information: OAuthClientInformation) {
      state.clientInformation = information;
      await persistence?.saveClientInformation?.(information);
    },
    codeVerifier() {
      if (!state.codeVerifier) {
        throw new Error("The MCP OAuth code verifier is unavailable");
      }
      return state.codeVerifier;
    },
    async saveCodeVerifier(codeVerifier: string) {
      state.codeVerifier = codeVerifier;
      await persistence?.saveCodeVerifier?.(codeVerifier);
    },
    redirectToAuthorization: onRedirect,
    saveState(nextState: string) {
      state.state = nextState;
    },
    state() {
      return state.state ?? crypto.randomUUID();
    },
    storedState() {
      return state.state;
    },
    tokens() {
      return state.tokens;
    },
    async saveTokens(tokens: OAuthTokens) {
      const nextTokens =
        tokens.refresh_token || !state.tokens?.refresh_token
          ? tokens
          : { ...tokens, refresh_token: state.tokens.refresh_token };
      state.tokens = nextTokens;
      await persistence?.saveTokens?.(nextTokens);
    },
    async validateAuthorizationServerURL(_serverUrl, authorizationServerUrl) {
      await assertPublicHttpUrlResolution(String(authorizationServerUrl));
    },
  };
}

export async function publicMcpOAuthFetch(
  input: RequestInfo | URL,
  init?: RequestInit
) {
  const url = input instanceof Request ? input.url : String(input);
  await assertPublicHttpUrlResolution(url);
  return fetch(input, { ...init, redirect: "error" });
}

export function createPublicMcpOAuthFetch(
  onScopesSupported: (scopes: string[]) => void
) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await publicMcpOAuthFetch(input, init);
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const metadata = mcpOAuthScopesMetadataSchema.safeParse(
        await response
          .clone()
          .json()
          .catch(() => undefined)
      );
      if (metadata.success && metadata.data.scopes_supported) {
        onScopesSupported(metadata.data.scopes_supported);
      }
    }
    return response;
  };
}
