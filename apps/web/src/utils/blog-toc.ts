import type { TOCItemType } from "fumadocs-core/toc";
import { HTML_ENTITY_MAP, HTML_ENTITY_REGEX } from "@/utils/constants";

const HEADING_WITH_TAG_REGEX = /<h([2-4])([^>]*)>([\s\S]*?)<\/h\1>/gi;
const WHITESPACE_REGEX = /\s+/g;
const ID_ATTRIBUTE_REGEX = /\sid\s*=\s*["']([^"']+)["']/i;
const DIACRITICS_REGEX = /[̀-ͯ]/g;
const NON_ALPHANUM_REGEX = /[^a-z0-9]+/g;
const TRIM_DASHES_REGEX = /^-+|-+$/g;
const SLUG_FALLBACK = "section";
const LESS_THAN = "<";
const GREATER_THAN = ">";

function decodeHtmlEntities(value: string) {
  return value.replace(
    HTML_ENTITY_REGEX,
    (match, entity: string) => HTML_ENTITY_MAP[entity] ?? match
  );
}

function htmlTextContent(value: string) {
  let text = "";
  let insideTag = false;

  for (const character of value) {
    if (character === LESS_THAN) {
      insideTag = true;
      continue;
    }

    if (character === GREATER_THAN && insideTag) {
      insideTag = false;
      continue;
    }

    if (!insideTag) {
      text += character;
    }
  }

  return text;
}

function stripHtml(value: string) {
  return decodeHtmlEntities(htmlTextContent(value))
    .replace(WHITESPACE_REGEX, " ")
    .trim();
}

function slugify(value: string) {
  const slug = value
    .normalize("NFKD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .replace(NON_ALPHANUM_REGEX, "-")
    .replace(TRIM_DASHES_REGEX, "");
  return slug || SLUG_FALLBACK;
}

function ensureUnique(base: string, used: Set<string>) {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let suffix = 2;
  let candidate = `${base}-${suffix}`;
  while (used.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  used.add(candidate);
  return candidate;
}

export function extractBlogToc(html: string): {
  html: string;
  toc: TOCItemType[];
} {
  const toc: TOCItemType[] = [];
  const used = new Set<string>();

  const transformed = html.replace(
    HEADING_WITH_TAG_REGEX,
    (match, levelGroup: string, attributes: string, content: string) => {
      const text = stripHtml(content);
      if (text.length === 0) {
        return match;
      }

      const existingId = attributes.match(ID_ATTRIBUTE_REGEX)?.[1];
      const id = existingId
        ? ensureUnique(existingId, used)
        : ensureUnique(slugify(text), used);

      toc.push({
        title: text,
        url: `#${id}`,
        depth: Number(levelGroup),
      });

      if (existingId === id) {
        return match;
      }

      const attributesWithoutId = existingId
        ? attributes.replace(ID_ATTRIBUTE_REGEX, "")
        : attributes;

      return `<h${levelGroup}${attributesWithoutId} id="${id}">${content}</h${levelGroup}>`;
    }
  );

  return { html: transformed, toc };
}
