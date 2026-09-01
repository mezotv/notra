export function toAnalyticsRoute(
  pathname: string | null | undefined,
  slug: string | null | undefined
): string | null {
  if (!pathname) {
    return null;
  }
  if (slug && pathname.startsWith(`/${slug}`)) {
    const stripped = pathname.slice(slug.length + 1);
    return stripped || "/";
  }
  return pathname;
}
