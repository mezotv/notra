const MCP_OAUTH_ERROR_BY_STATUS = new Map<number, string>([
  [401, "not_authenticated"],
  [403, "forbidden"],
]);

export function mcpOauthErrorParam(
  status: number,
  fallback = "mcp_auth_failed"
): string {
  return MCP_OAUTH_ERROR_BY_STATUS.get(status) ?? fallback;
}
