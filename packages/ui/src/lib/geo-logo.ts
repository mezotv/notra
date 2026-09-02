import { logoLinkUrl } from "@notra/utils/logo-link";

export function competitorLogoSources(domain: string | null): string[] {
  const logoLink = logoLinkUrl(domain);
  return logoLink ? [logoLink] : [];
}
