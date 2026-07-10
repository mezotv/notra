import { assertPublicHttpUrlResolution } from "@notra/utils/url";

export async function publicMcpOAuthFetch(
  input: RequestInfo | URL,
  init?: RequestInit
) {
  const url = input instanceof Request ? input.url : String(input);
  await assertPublicHttpUrlResolution(url);
  return fetch(input, { ...init, redirect: "error" });
}
