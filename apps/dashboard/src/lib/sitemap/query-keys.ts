export function sitemapsKey(organizationId: string, voiceId: string) {
  return ["brand-sitemaps", organizationId, voiceId] as const;
}

export function sitemapPagesKey(
  organizationId: string,
  voiceId: string,
  sitemapId: string
) {
  return ["brand-sitemap-pages", organizationId, voiceId, sitemapId] as const;
}
