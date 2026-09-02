import { logoLinkUrl } from "@notra/utils/logo-link";

import { GEO_AVATAR_FALLBACK_BASE } from "../constants/geo";

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
