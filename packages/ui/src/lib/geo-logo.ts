import { GEO_LOGO_LINK_BASE } from "@notra/ui/constants/geo";

function buildCompetitorLogoUrl(domain: string): string | null {
  const clientId = process.env.NEXT_PUBLIC_LOGOLINK_CLIENT_ID?.trim();
  if (!clientId) {
    return null;
  }

  const url = new URL(GEO_LOGO_LINK_BASE);
  url.searchParams.set("publicClientId", clientId);
  url.searchParams.set("domain", domain);
  return url.toString();
}

export function competitorLogoSources(domain: string | null): string[] {
  if (!domain) {
    return [];
  }

  const logoLink = buildCompetitorLogoUrl(domain);
  return logoLink ? [logoLink] : [];
}
