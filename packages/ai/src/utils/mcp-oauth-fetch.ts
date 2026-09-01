import { MCP_OAUTH_FETCH_TIMEOUT_MS } from "../constants/mcp-auth";
import { fetchPublicMcpUrl } from "./public-fetch";

export async function publicMcpOAuthFetch(
  input: RequestInfo | URL,
  init?: RequestInit
) {
  return fetchPublicMcpUrl(input, init, MCP_OAUTH_FETCH_TIMEOUT_MS);
}
