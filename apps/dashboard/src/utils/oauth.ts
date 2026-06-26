import type { OAuthAuthorizeRequest } from "@/types/oauth";

function truncateOAuthDisplayValue(value: string) {
  return value.length > 80 ? `${value.slice(0, 77)}...` : value;
}

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
    return url.hostname || truncateOAuthDisplayValue(clientId);
  } catch {
    return truncateOAuthDisplayValue(clientId);
  }
}

export function getOAuthResourceDisplayName(resource: string) {
  try {
    const { hostname } = new URL(resource);
    if (hostname === "mcp.usenotra.com") {
      return "Notra MCP";
    }
    if (hostname === "api.usenotra.com") {
      return "Notra API";
    }
  } catch {
    return resource;
  }
  return resource;
}
