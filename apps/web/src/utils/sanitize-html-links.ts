import {
  ANCHOR_TAG_REGEX,
  DECIMAL_ENTITY_REGEX,
  ENCODED_ANCHOR_REGEX,
  ENCODED_APOS_REGEX,
  ENCODED_QUOTE_REGEX,
  EXTERNAL_HREF_REGEX,
  FIGCAPTION_REGEX,
  HEX_ENTITY_REGEX,
  HREF_ATTR_REGEX,
  HREF_ATTR_REPLACE_REGEX,
  MAX_CODE_POINT,
  REL_ATTR_MATCH_REGEX,
  REL_ATTR_REPLACE_REGEX,
  REL_SPLIT_REGEX,
  SAFE_SCHEMES,
  STRIPPED_URL_CHARS_REGEX,
  TARGET_ATTR_REGEX,
  URL_SCHEME_REGEX,
} from "@/lib/sanitize-html-links/constants";

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
        '$1href="#"'
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
        `$1rel="${relValue}"`
      );
    } else {
      updatedAttrs += ` rel="${relValue}"`;
    }

    if (TARGET_ATTR_REGEX.test(updatedAttrs)) {
      updatedAttrs = updatedAttrs.replace(
        TARGET_ATTR_REGEX,
        '$1target="_blank"'
      );
    } else {
      updatedAttrs += ' target="_blank"';
    }

    return `<a ${updatedAttrs}>`;
  });
}

function decodeAnchorMarkup(value: string): string {
  return value
    .replace(ENCODED_QUOTE_REGEX, '"')
    .replace(ENCODED_APOS_REGEX, "'");
}

export function decodeFigcaptionLinks(html: string): string {
  return html.replace(
    FIGCAPTION_REGEX,
    (_match, attrs: string, content: string) => {
      const decoded = content.replace(
        ENCODED_ANCHOR_REGEX,
        (_anchor, anchorAttrs: string, text: string) =>
          `<a${decodeAnchorMarkup(anchorAttrs)}>${decodeAnchorMarkup(text)}</a>`
      );

      return `<figcaption${attrs}>${decoded}</figcaption>`;
    }
  );
}
