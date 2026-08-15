const AUTHKIT_METADATA_PATH = "/.well-known/oauth-authorization-server";
const METADATA_CACHE_CONTROL = "public, max-age=300";
const METADATA_ERROR_CACHE_CONTROL = "no-store";

export async function fetchAuthKitAuthorizationServerMetadata() {
  const domain = process.env.WORKOS_AUTHKIT_DOMAIN;

  if (!domain) {
    return Response.json(
      { error: "authorization_server_not_configured" },
      {
        status: 503,
        headers: { "Cache-Control": METADATA_ERROR_CACHE_CONTROL },
      }
    );
  }

  const response = await fetch(`https://${domain}${AUTHKIT_METADATA_PATH}`, {
    next: { revalidate: 300 },
  });
  const metadata = await response.json();

  return Response.json(metadata, {
    status: response.status,
    headers: {
      "Cache-Control": response.ok
        ? METADATA_CACHE_CONTROL
        : METADATA_ERROR_CACHE_CONTROL,
    },
  });
}
