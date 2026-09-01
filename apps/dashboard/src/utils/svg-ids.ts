const SVG_ID_ATTRIBUTE = /\bid="([^"]+)"/g;
const SVG_URL_REFERENCE = /url\(#([^)]+)\)/g;
const SVG_HREF_REFERENCE = /\bhref="#([^"]+)"/g;
const SVG_ID_UNSAFE = /[^a-z0-9]+/gi;

export function svgIdPrefix(scope: string): string {
  return `${scope.replace(SVG_ID_UNSAFE, "-").toLowerCase()}-`;
}

export function prefixSvgIds(markup: string, prefix: string): string {
  return markup
    .replace(SVG_ID_ATTRIBUTE, (_match, id: string) => `id="${prefix}${id}"`)
    .replace(SVG_URL_REFERENCE, (_match, id: string) => `url(#${prefix}${id})`)
    .replace(
      SVG_HREF_REFERENCE,
      (_match, id: string) => `href="#${prefix}${id}"`
    );
}
