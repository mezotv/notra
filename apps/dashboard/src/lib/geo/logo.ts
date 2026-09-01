import { competitorLogoSources } from "@notra/ui/lib/geo-logo";
import { GEO_AVATAR_FALLBACK_BASE } from "@/constants/geo";

export function projectLogoSources(
  domain: string | null,
  seed: string
): string[] {
  const fallback = `${GEO_AVATAR_FALLBACK_BASE}?seed=${encodeURIComponent(seed)}`;
  return [...competitorLogoSources(domain), fallback];
}
