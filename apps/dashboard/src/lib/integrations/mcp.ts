import {
  type AddMcpServerFormValues,
  MCP_URL_PROTOCOL_REGEX,
  type McpAuthType,
} from "@/schemas/integrations";

export const MCP_ACCENT_COLOR = "#9333EA";

export function buildMcpUrl(raw: string) {
  const host = raw.trim().replace(MCP_URL_PROTOCOL_REGEX, "");
  return host ? `https://${host}` : "";
}

export function getMcpFaviconUrl(url: string | null | undefined) {
  if (!url) {
    return undefined;
  }
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
  try {
    const domain = new URL(normalizedUrl).hostname
      .split(".")
      .slice(-2)
      .join(".");
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  } catch {
    return undefined;
  }
}

export function getMcpFormErrorMessage(error: unknown) {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "Invalid value";
}

export function buildMcpOauthAuthorizeUrl(params: {
  organizationId: string;
  serverId: string;
  callbackPath: string;
}) {
  const query = new URLSearchParams({
    organizationId: params.organizationId,
    serverId: params.serverId,
    callbackPath: params.callbackPath,
  });
  return `/api/integrations/mcp/oauth/authorize?${query.toString()}`;
}

const MCP_OAUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Authorization was cancelled on the MCP server.",
  unsupported:
    "This MCP server does not support OAuth. Connect it with API key headers instead.",
  discovery_failed:
    "Could not discover OAuth support on this MCP server. Connect it with API key headers instead.",
  token_exchange_failed:
    "The MCP server rejected the authorization. Try connecting again.",
  server_not_found: "MCP server not found.",
  mcp_oauth_not_configured: "OAuth connections are not configured.",
};

export function getSubmitLabel(authType: McpAuthType, isPending: boolean) {
  if (authType === "oauth") {
    return isPending ? "Connecting..." : "Connect & Authorize";
  }
  return isPending ? "Adding..." : "Add Server";
}

export function getMcpOauthErrorMessage(code: string) {
  return (
    MCP_OAUTH_ERROR_MESSAGES[code] ??
    "Could not authorize the MCP server. Try again."
  );
}

export function buildMcpHeaders(
  value: Pick<AddMcpServerFormValues, "headers">
) {
  const headers: Record<string, string> = {};

  for (const row of value.headers) {
    const name = row.name.trim();
    const headerValue = row.value.trim();
    if (name && headerValue) {
      headers[name] = headerValue;
    }
  }

  return headers;
}
