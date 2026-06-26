const AUTH_ROUTE_PREFIX = "/api/auth";

export async function proxyOAuthRequest(request: Request, pathname: string) {
  const targetUrl = new URL(`${AUTH_ROUTE_PREFIX}${pathname}`, request.url);
  targetUrl.search = new URL(request.url).search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  const response = await fetch(targetUrl, {
    body,
    headers,
    method: request.method,
    redirect: "manual",
  });

  return new Response(response.body, {
    headers: response.headers,
    status: response.status,
  });
}
