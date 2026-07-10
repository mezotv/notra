import { assertPublicHttpUrlResolution } from "@notra/utils/url";
import { McpUnauthorizedError } from "../integrations/mcp-auth-errors";

export async function publicMcpRuntimeFetch(
  input: RequestInfo | URL,
  init?: RequestInit
) {
  const url = input instanceof Request ? input.url : String(input);
  await assertPublicHttpUrlResolution(url);
  const response = await fetch(input, { ...init, redirect: "error" });
  if (response.status === 401) {
    throw new McpUnauthorizedError();
  }
  return response;
}
