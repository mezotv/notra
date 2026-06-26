import { proxyOAuthRequest } from "@/utils/oauth-proxy";

export function OPTIONS() {
  return new Response(null, { status: 204 });
}

export function POST(request: Request) {
  return proxyOAuthRequest(request, "/oauth2/revoke");
}
