import { McpUnauthorizedError } from "../integrations/mcp-auth-errors";
import { fetchPublicMcpUrl } from "./mcp-public-fetch";

export async function publicMcpRuntimeFetch(
  input: RequestInfo | URL,
  init?: RequestInit
) {
  const response = await fetchPublicMcpUrl(input, init);
  if (response.status === 401) {
    await response.body?.cancel();
    throw new McpUnauthorizedError();
  }
  return response;
}
