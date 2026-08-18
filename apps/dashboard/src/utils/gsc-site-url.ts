const SC_DOMAIN_PREFIX = "sc-domain:";

export function formatGscSiteUrl(siteUrl: string): string {
  return siteUrl.startsWith(SC_DOMAIN_PREFIX)
    ? `${siteUrl.slice(SC_DOMAIN_PREFIX.length)} (domain)`
    : siteUrl;
}
