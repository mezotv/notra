export function getBrandFaviconUrl(websiteUrl: string | null) {
  if (!websiteUrl) {
    return undefined;
  }
  const normalizedUrl = websiteUrl.startsWith("http")
    ? websiteUrl
    : `https://${websiteUrl}`;
  try {
    return `https://icons.duckduckgo.com/ip3/${new URL(normalizedUrl).hostname}.ico`;
  } catch {
    return undefined;
  }
}
