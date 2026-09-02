import { GEO_AVATAR_FALLBACK_BASE, GEO_LOGO_LINK_BASE } from "../constants/geo";

export function logoLinkUrl(domain: string | null): string | null {
  const clientId = process.env.NEXT_PUBLIC_LOGOLINK_CLIENT_ID?.trim();
  if (!domain || !clientId) {
    return null;
  }

  const url = new URL(GEO_LOGO_LINK_BASE);
  url.searchParams.set("publicClientId", clientId);
  url.searchParams.set("domain", domain);
  return url.toString();
}

export function competitorLogoSources(
  domain: string | null,
  logo: string | null
): string[] {
  const sources: string[] = [];
  if (logo) {
    sources.push(logo);
  }
  const logoLink = logoLinkUrl(domain);
  if (logoLink) {
    sources.push(logoLink);
  }
  return sources;
}

export function projectLogoSources(
  domain: string | null,
  seed: string,
  logo: string | null
): string[] {
  const fallback = `${GEO_AVATAR_FALLBACK_BASE}?seed=${encodeURIComponent(seed)}`;
  return [...competitorLogoSources(domain, logo), fallback];
}
