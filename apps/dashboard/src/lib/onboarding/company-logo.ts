import type {
  ContextDevBrandLogo,
  ContextDevBrandSearchResult,
} from "@notra/ai/types/context-dev";

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

function brandSearchKey(value: string): string {
  return value.trim().toLowerCase();
}

/** Prefer an exact hit, then a prefix, then context.dev's own ranking. */
export function pickBrandSearchResult(
  results: readonly ContextDevBrandSearchResult[],
  query: string
): ContextDevBrandSearchResult | null {
  if (results.length === 0) {
    return null;
  }

  const key = brandSearchKey(query);
  const exactName = results.find(
    (result) => brandSearchKey(result.name) === key
  );
  if (exactName) {
    return exactName;
  }
  const exactDomain = results.find(
    (result) => brandSearchKey(result.domain) === key
  );
  if (exactDomain) {
    return exactDomain;
  }
  const prefix = results.find((result) => {
    const name = brandSearchKey(result.name);
    return name.startsWith(key) || key.startsWith(name);
  });
  return prefix ?? results[0] ?? null;
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
