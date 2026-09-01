import { GEO_AVATAR_FALLBACK_BASE, GEO_FAVICON_BASE } from "../constants/geo";

function buildCompetitorFaviconUrl(domain: string): string {
  return `${GEO_FAVICON_BASE}/${encodeURIComponent(domain)}.ico`;
}

export function competitorLogoSources(
  domain: string | null,
  logo: string | null
): string[] {
  if (!domain) {
    return logo ? [logo] : [];
  }

  const favicon = buildCompetitorFaviconUrl(domain);
  return logo ? [logo, favicon] : [favicon];
}

export function projectLogoSources(
  domain: string | null,
  seed: string,
  logo: string | null
): string[] {
  const fallback = `${GEO_AVATAR_FALLBACK_BASE}?seed=${encodeURIComponent(seed)}`;
  return [...competitorLogoSources(domain, logo), fallback];
}
