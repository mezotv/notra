const TRACKING_QUERY_PARAMETERS = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref_src",
]);

const X_HOSTNAMES = new Set([
  "mobile.twitter.com",
  "twitter.com",
  "www.twitter.com",
  "www.x.com",
  "x.com",
]);

const TRAILING_PATH_SLASHES_PATTERN = /\/+$/;
const X_STATUS_PATH_PATTERN =
  /^\/(?:i\/web\/)?(?:[^/]+\/)?status\/(\d+)(?:\/.*)?$/;

function isTrackingQueryParameter(key: string) {
  const normalizedKey = key.toLowerCase();
  return (
    normalizedKey.startsWith("utm_") ||
    TRACKING_QUERY_PARAMETERS.has(normalizedKey)
  );
}

export function canonicalizeReferenceSourceUrl(sourceUrl: string) {
  const url = new URL(sourceUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Reference source URL must use HTTP or HTTPS");
  }
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();

  if (X_HOSTNAMES.has(url.hostname)) {
    const statusMatch = X_STATUS_PATH_PATTERN.exec(url.pathname);
    url.hostname = "x.com";
    url.protocol = "https:";
    if (statusMatch?.[1]) {
      url.pathname = `/i/status/${statusMatch[1]}`;
      url.search = "";
    }
  }

  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(TRAILING_PATH_SLASHES_PATTERN, "");
  }

  for (const key of [...url.searchParams.keys()]) {
    if (isTrackingQueryParameter(key)) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();

  return url.href;
}
