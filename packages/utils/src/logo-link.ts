export const LOGO_LINK_BASE_URL = "https://logos.context.dev/";

export function logoLinkUrl(domain: string | null): string | null {
  const clientId = process.env.NEXT_PUBLIC_LOGOLINK_CLIENT_ID?.trim();
  if (!domain || !clientId) {
    return null;
  }

  const url = new URL(LOGO_LINK_BASE_URL);
  url.searchParams.set("publicClientId", clientId);
  url.searchParams.set("domain", domain);
  return url.toString();
}
