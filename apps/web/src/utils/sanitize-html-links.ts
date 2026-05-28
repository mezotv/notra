const EXTERNAL_HREF_REGEX = /^(https?:)?\/\//;
const ANCHOR_TAG_REGEX = /<a\s([^>]*)>/gi;
const HREF_ATTR_REGEX = /href=["']([^"']*)["']/;
const HREF_ATTR_REPLACE_REGEX = /href=["'][^"']*["']/;
const REL_ATTR_MATCH_REGEX = /rel=["']([^"']*)["']/;
const REL_SPLIT_REGEX = /\s+/;
const REL_ATTR_REPLACE_REGEX = /rel=["'][^"']*["']/;
const TARGET_ATTR_REGEX = /target=["'][^"']*["']/;

const HEX_ENTITY_REGEX = /&#x([0-9a-f]+);?/gi;
const DECIMAL_ENTITY_REGEX = /&#(\d+);?/g;
const STRIPPED_URL_CHARS_REGEX = /[\t\n\r]/g;
const URL_SCHEME_REGEX = /^([a-z][a-z0-9+.-]*):/;
const MAX_CODE_POINT = 0x10_ff_ff;
const SAFE_SCHEMES = new Set(["http", "https", "mailto", "tel"]);

function decodeCodePoint(code: number): string {
  if (Number.isNaN(code) || code < 0 || code > MAX_CODE_POINT) {
    return "";
  }

  return String.fromCodePoint(code);
}

function isSafeHref(href: string): boolean {
  const normalized = href
    .replace(HEX_ENTITY_REGEX, (_, hex: string) =>
      decodeCodePoint(Number.parseInt(hex, 16))
    )
    .replace(DECIMAL_ENTITY_REGEX, (_, dec: string) =>
      decodeCodePoint(Number.parseInt(dec, 10))
    )
    .replace(STRIPPED_URL_CHARS_REGEX, "")
    .trimStart()
    .toLowerCase();

  const scheme = normalized.match(URL_SCHEME_REGEX)?.[1];

  if (!scheme) {
    return true;
  }

  return SAFE_SCHEMES.has(scheme);
}

export function addExternalLinkAttrs(html: string): string {
  return html.replace(ANCHOR_TAG_REGEX, (match, attrs: string) => {
    const hrefMatch = attrs.match(HREF_ATTR_REGEX);
    const href = hrefMatch?.[1];

    if (href && !isSafeHref(href)) {
      const neutralizedAttrs = attrs.replace(
        HREF_ATTR_REPLACE_REGEX,
        'href="#"'
      );

      return `<a ${neutralizedAttrs}>`;
    }

    if (!href || !EXTERNAL_HREF_REGEX.test(href)) {
      return match;
    }

    let updatedAttrs = attrs;

    const relMatch = updatedAttrs.match(REL_ATTR_MATCH_REGEX);
    const tokens = new Set(
      (relMatch?.[1] ?? "").split(REL_SPLIT_REGEX).filter(Boolean)
    );
    tokens.add("noopener");
    tokens.add("noreferrer");
    const relValue = [...tokens].join(" ");

    if (relMatch) {
      updatedAttrs = updatedAttrs.replace(
        REL_ATTR_REPLACE_REGEX,
        `rel="${relValue}"`
      );
    } else {
      updatedAttrs += ` rel="${relValue}"`;
    }

    if (TARGET_ATTR_REGEX.test(updatedAttrs)) {
      updatedAttrs = updatedAttrs.replace(TARGET_ATTR_REGEX, 'target="_blank"');
    } else {
      updatedAttrs += ' target="_blank"';
    }

    return `<a ${updatedAttrs}>`;
  });
}
