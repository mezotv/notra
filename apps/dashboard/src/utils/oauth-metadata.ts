import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import type { auth } from "@/lib/auth/server";

const METADATA_CACHE_CONTROL = "public, max-age=3600";

function buildPublicOAuthEndpoint(request: Request, pathname: string) {
  return new URL(pathname, request.url).toString();
}

export function publicOAuthAuthorizationServerMetadata(
  authInstance: typeof auth
) {
  const getMetadata = oauthProviderAuthServerMetadata(authInstance, {
    headers: {
      "Cache-Control": METADATA_CACHE_CONTROL,
    },
  });

  return async (request: Request) => {
    const response = await getMetadata(request);
    const metadata = await response.json();

    return Response.json(
      {
        ...metadata,
        authorization_endpoint: buildPublicOAuthEndpoint(
          request,
          "/agent/auth/authorize"
        ),
        token_endpoint: buildPublicOAuthEndpoint(request, "/agent/auth/token"),
        registration_endpoint: buildPublicOAuthEndpoint(
          request,
          "/agent/auth/register"
        ),
        revocation_endpoint: buildPublicOAuthEndpoint(
          request,
          "/agent/auth/revoke"
        ),
      },
      {
        headers: {
          "Cache-Control": METADATA_CACHE_CONTROL,
        },
      }
    );
  };
}
