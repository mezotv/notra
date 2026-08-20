import {
  GEO_AVATAR_FALLBACK_BASE,
  GEO_FAVICON_BASE,
  GEO_LOGO_LINK_BASE,
} from "@/constants/geo";

function buildCompetitorLogoUrl(domain: string): string | null {
  const clientId = process.env.NEXT_PUBLIC_LOGOLINK_CLIENT_ID;
  if (!clientId) {
    return null;
  }

  const url = new URL(GEO_LOGO_LINK_BASE);
  url.searchParams.set("publicClientId", clientId);
  url.searchParams.set("domain", domain);
  return url.toString();
}

function buildCompetitorFaviconUrl(domain: string): string {
  return `${GEO_FAVICON_BASE}/${encodeURIComponent(domain)}.ico`;
}

export function competitorLogoSources(domain: string | null): string[] {
  if (!domain) {
    return [];
  }

  const logoLink = buildCompetitorLogoUrl(domain);
  const favicon = buildCompetitorFaviconUrl(domain);
  return logoLink ? [logoLink, favicon] : [favicon];
}

export function projectLogoSources(
  domain: string | null,
  seed: string
): string[] {
  const fallback = `${GEO_AVATAR_FALLBACK_BASE}?seed=${encodeURIComponent(seed)}`;
  return [...competitorLogoSources(domain), fallback];
}
