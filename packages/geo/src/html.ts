import { JOURNEY_ID_PATTERN } from "./constants";
import { appendJourneyParam, isTaggableTarget } from "./link-target";
import type { TagHtmlLinksOptions } from "./types";

const ANCHOR_TAG = /<a\b[^>]*>/gi;
const HREF_ATTRIBUTE = /(\shref\s*=\s*)(?:"([^"]*)"|'([^']*)')/i;
const ENCODED_AMPERSAND = "&amp;";

export function tagHtmlLinks(
  html: string,
  journeyId: string,
  options: TagHtmlLinksOptions = {}
): string {
  if (!JOURNEY_ID_PATTERN.test(journeyId)) {
    return html;
  }

  return html.replace(ANCHOR_TAG, (tag) =>
    tag.replace(
      HREF_ATTRIBUTE,
      (
        match: string,
        prefix: string,
        doubleQuoted: string | undefined,
        singleQuoted: string | undefined
      ) => {
        const target = doubleQuoted ?? singleQuoted;
        if (target === undefined) {
          return match;
        }
        if (!isTaggableTarget(target, options.host)) {
          return match;
        }

        const quote = doubleQuoted === undefined ? "'" : '"';
        const ampersand = target.includes(ENCODED_AMPERSAND)
          ? ENCODED_AMPERSAND
          : "&";

        return `${prefix}${quote}${appendJourneyParam(target, journeyId, ampersand)}${quote}`;
      }
    )
  );
}
