import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import {
  OAUTH_METADATA_CACHE_CONTROL,
  OAUTH_METADATA_ERROR_CACHE_CONTROL,
  OAUTH_PUBLIC_AUTHORIZATION_ENDPOINT,
  OAUTH_PUBLIC_REGISTRATION_ENDPOINT,
  OAUTH_PUBLIC_REVOCATION_ENDPOINT,
  OAUTH_PUBLIC_TOKEN_ENDPOINT,
} from "@/constants/oauth";
import type { auth } from "@/lib/auth/server";

function buildPublicOAuthEndpoint(request: Request, pathname: string) {
  return new URL(pathname, request.url).toString();
}

export function publicOAuthAuthorizationServerMetadata(
  authInstance: typeof auth
) {
  const getMetadata = oauthProviderAuthServerMetadata(authInstance, {
    headers: {
      "Cache-Control": OAUTH_METADATA_CACHE_CONTROL,
    },
  });

  return async (request: Request) => {
    const response = await getMetadata(request);
    const metadata = await response.json();

    if (!response.ok) {
      return Response.json(metadata, {
        headers: {
          "Cache-Control": OAUTH_METADATA_ERROR_CACHE_CONTROL,
        },
        status: response.status,
      });
    }

    return Response.json(
      {
        ...metadata,
        authorization_endpoint: buildPublicOAuthEndpoint(
          request,
          OAUTH_PUBLIC_AUTHORIZATION_ENDPOINT
        ),
        token_endpoint: buildPublicOAuthEndpoint(
          request,
          OAUTH_PUBLIC_TOKEN_ENDPOINT
        ),
        registration_endpoint: buildPublicOAuthEndpoint(
          request,
          OAUTH_PUBLIC_REGISTRATION_ENDPOINT
        ),
        revocation_endpoint: buildPublicOAuthEndpoint(
          request,
          OAUTH_PUBLIC_REVOCATION_ENDPOINT
        ),
      },
      {
        headers: {
          "Cache-Control": OAUTH_METADATA_CACHE_CONTROL,
        },
        status: response.status,
      }
    );
  };
}
