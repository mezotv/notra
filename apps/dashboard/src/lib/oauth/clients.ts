import {
  OAUTH_CLIENT_BRANDS,
  type OAuthClientBrandId,
} from "@/constants/oauth-clients";
import type { OAuthClientIdentity } from "@/types/oauth";

export function resolveOAuthClientBrandId(
  client: OAuthClientIdentity
): OAuthClientBrandId | null {
  const haystack = [client.client_name, client.client_id, client.client_uri]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  if (!haystack) {
    return null;
  }

  const brand = OAUTH_CLIENT_BRANDS.find((item) =>
    item.keywords.some((keyword) => haystack.includes(keyword))
  );

  return brand?.id ?? null;
}
