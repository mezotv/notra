const EXTERNAL_HREF_REGEX = /^(https?:)?\/\//;
const ANCHOR_TAG_REGEX = /<a\s([^>]*)>/gi;
const HREF_ATTR_REGEX = /href=["']([^"']*)["']/;
const REL_ATTR_MATCH_REGEX = /rel=["']([^"']*)["']/;
const REL_SPLIT_REGEX = /\s+/;
const REL_ATTR_REPLACE_REGEX = /rel=["'][^"']*["']/;
const TARGET_ATTR_REGEX = /target=["'][^"']*["']/;

export function addExternalLinkAttrs(html: string): string {
  return html.replace(ANCHOR_TAG_REGEX, (match, attrs: string) => {
    const hrefMatch = attrs.match(HREF_ATTR_REGEX);
    const href = hrefMatch?.[1];

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
