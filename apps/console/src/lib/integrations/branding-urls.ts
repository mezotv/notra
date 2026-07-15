import "server-only";

function isAllowedBrandingAssetUrl(url: string, organizationId: string) {
  const publicUrl = process.env.CLOUDFLARE_PUBLIC_URL;
  if (!publicUrl) {
    return false;
  }

  let parsed: URL;
  let allowedHost: string;
  try {
    parsed = new URL(url);
    allowedHost = new URL(publicUrl).hostname;
  } catch {
    return false;
  }

  return (
    parsed.hostname === allowedHost &&
    parsed.pathname.startsWith(
      `/organization/${organizationId}/integration-branding/`
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
