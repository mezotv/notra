import "server-only";

const ALLOWED_HOST_SUFFIXES = [".r2.dev", ".r2.cloudflarestorage.com"];

function isAllowedBrandingAssetUrl(url: string | null | undefined) {
  if (!url) {
    return true;
  }

  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return false;
  }

  if (ALLOWED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
    return true;
  }

  const publicUrl = process.env.CLOUDFLARE_PUBLIC_URL;
  if (!publicUrl) {
    return false;
  }

  try {
    return hostname === new URL(publicUrl).hostname;
  } catch {
    return false;
  }
}

export function findDisallowedBrandingAssetUrl(input: {
  logoLightUrl?: string | null;
  logoDarkUrl?: string | null;
  bannerUrl?: string | null;
}) {
  for (const url of [input.logoLightUrl, input.logoDarkUrl, input.bannerUrl]) {
    if (!isAllowedBrandingAssetUrl(url)) {
      return url ?? null;
    }
  }
  return null;
}
