const TRACKING_PARAM_PREFIXES = ["utm_", "ref", "fbclid", "gclid", "mc_"];

function isTrackingParam(name: string): boolean {
  const lower = name.toLowerCase();
  return TRACKING_PARAM_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

export function canonicalizeShelfUrl(raw: string): string {
  const url = new URL(raw.trim());
  url.hash = "";
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  for (const name of [...url.searchParams.keys()]) {
    if (isTrackingParam(name)) {
      url.searchParams.delete(name);
    }
  }
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }
  return url.toString();
}

export function shelfDomainFromUrl(url: string): string {
  return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
}
