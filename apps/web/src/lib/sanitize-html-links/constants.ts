export const EXTERNAL_HREF_REGEX = /^(https?:)?\/\//i;
export const ANCHOR_TAG_REGEX = /<a\s([^>]*)>/gi;
export const HREF_ATTR_REGEX = /(?:^|\s)href=["']([^"']*)["']/i;
export const HREF_ATTR_REPLACE_REGEX = /(^|\s)href=["'][^"']*["']/i;
export const REL_ATTR_MATCH_REGEX = /(?:^|\s)rel=["']([^"']*)["']/i;
export const REL_SPLIT_REGEX = /\s+/;
export const REL_ATTR_REPLACE_REGEX = /(^|\s)rel=["'][^"']*["']/i;
export const TARGET_ATTR_REGEX = /(^|\s)target=["'][^"']*["']/i;

export const HEX_ENTITY_REGEX = /&#x([0-9a-f]+);?/gi;
export const DECIMAL_ENTITY_REGEX = /&#(\d+);?/g;
export const STRIPPED_URL_CHARS_REGEX = /[\t\n\r]/g;
export const URL_SCHEME_REGEX = /^([a-z][a-z0-9+.-]*):/;
export const MAX_CODE_POINT = 0x10_ff_ff;
export const SAFE_SCHEMES = new Set(["http", "https", "mailto", "tel"]);

export const FIGCAPTION_REGEX = /<figcaption([^>]*)>([\s\S]*?)<\/figcaption>/gi;
export const ENCODED_ANCHOR_REGEX =
  /&lt;a\b([\s\S]*?)&gt;([\s\S]*?)&lt;\/a&gt;/gi;
export const ENCODED_QUOTE_REGEX = /&quot;/g;
export const ENCODED_APOS_REGEX = /&#39;/g;
