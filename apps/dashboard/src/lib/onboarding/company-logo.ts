import type { ContextDevBrandLogo } from "@notra/ai/types/context-dev";

const RASTER_URL_REGEX = /\.(png|jpe?g|webp|avif|gif)(\?|$)/i;
const PROTOCOL_REGEX = /^https?:\/\//i;

export function pickCompanyLogoUrl(
  logos: ContextDevBrandLogo[] | undefined
): string | null {
  if (!logos?.length) {
    return null;
  }

  const rasterLogos = logos.filter(
    (logo) => logo.url && RASTER_URL_REGEX.test(logo.url)
  );
  const icons = rasterLogos.filter((logo) => logo.type === "icon");

  const preferred =
    icons.find((logo) => logo.mode === "has_opaque_background") ??
    icons.find((logo) => logo.mode === "light") ??
    icons[0] ??
    rasterLogos[0];

  return preferred?.url ?? null;
}

export function extractDomain(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  const host = trimmed
    .replace(PROTOCOL_REGEX, "")
    .split("/")[0]
    ?.split("?")[0]
    ?.split("@")
    .at(-1);

  if (!host || !host.includes(".") || host.endsWith(".")) {
    return null;
  }

  return host;
}
