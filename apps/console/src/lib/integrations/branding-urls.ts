import "server-only";

const TRAILING_SLASHES_RE = /\/+$/;

function isAllowedBrandingAssetUrl(url: string, organizationId: string) {
  const publicUrl = process.env.CLOUDFLARE_PUBLIC_URL;
  if (!publicUrl) {
    return false;
  }

  let parsed: URL;
  let allowed: URL;
  try {
    parsed = new URL(url);
    allowed = new URL(publicUrl);
  } catch {
    return false;
  }

  const basePath = allowed.pathname.replace(TRAILING_SLASHES_RE, "");

  return (
    parsed.origin === allowed.origin &&
    parsed.pathname.startsWith(
      `${basePath}/organization/${organizationId}/integration-branding/`
    )
  );
}

export function findDisallowedBrandingAssetUrl(input: {
  organizationId: string;
  urls: Array<string | null | undefined>;
}) {
  for (const url of input.urls) {
    if (url && !isAllowedBrandingAssetUrl(url, input.organizationId)) {
      return url;
    }
  }
  return null;
}
