import { GEO_LOGO_LINK_BASE } from "@/constants/geo";

export function buildCompetitorLogoUrl(domain: string): string | null {
  const clientId = process.env.NEXT_PUBLIC_LOGOLINK_CLIENT_ID;
  if (!clientId) {
    return null;
  }

  const url = new URL(GEO_LOGO_LINK_BASE);
  url.searchParams.set("publicClientId", clientId);
  url.searchParams.set("domain", domain);
  return url.toString();
}
