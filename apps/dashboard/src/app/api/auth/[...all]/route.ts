import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth/server";
import { isOAuthDynamicClientRegistrationPath } from "@/utils/oauth-client-registration";
import { proxyOAuthRequest } from "@/utils/oauth-proxy";

const authHandler = toNextJsHandler(auth);

export const GET = authHandler.GET;

export function POST(request: Request) {
  if (isOAuthDynamicClientRegistrationPath(new URL(request.url).pathname)) {
    return proxyOAuthRequest(request, "/oauth2/register");
  }

  return authHandler.POST(request);
}
