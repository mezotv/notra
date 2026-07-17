import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth/server";
import { proxyOAuthRequest } from "@/utils/oauth-proxy";

const authHandler = toNextJsHandler(auth);

export const GET = authHandler.GET;

export function POST(request: Request) {
  if (new URL(request.url).pathname === "/api/auth/oauth2/register") {
    return proxyOAuthRequest(request, "/oauth2/register");
  }

  return authHandler.POST(request);
}
