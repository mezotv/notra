import type { OAuthAuthorizeRequest } from "@/types/oauth";

export function buildOAuthAuthorizePath(params: OAuthAuthorizeRequest) {
  const searchParams = new URLSearchParams({
    response_type: params.responseType,
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    scope: params.scope,
    code_challenge: params.codeChallenge,
    code_challenge_method: params.codeChallengeMethod,
    resource: params.resource,
  });

  if (params.state) {
    searchParams.set("state", params.state);
  }

  return `/agent/auth/authorize?${searchParams.toString()}`;
}

export function getOAuthClientDisplayName(clientId: string) {
  try {
    const url = new URL(clientId);
    return url.hostname;
  } catch {
    return clientId.length > 80 ? `${clientId.slice(0, 77)}...` : clientId;
  }
}

export function getOAuthResourceDisplayName(resource: string) {
  if (resource.includes("mcp.usenotra.com")) {
    return "Notra MCP";
  }
  if (resource.includes("api.usenotra.com")) {
    return "Notra API";
  }
  return resource;
}
