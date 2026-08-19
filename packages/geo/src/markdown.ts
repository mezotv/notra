import {
  JOURNEY_ID_BYTES,
  JOURNEY_ID_PARAM,
  JOURNEY_ID_PATTERN,
} from "./constants";
import {
  appendJourneyParam,
  isTaggableTarget,
  RESOLVE_BASE,
} from "./link-target";
import type { TagMarkdownLinksOptions } from "./types";

const FENCE_SPLIT = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/;
const INLINE_CODE_SPLIT = /(`+[^`]*`+)/;
const INLINE_LINK = /(!?)\[([^\]]*)\]\(\s*([^()\s]+)((?:\s+"[^"]*")?)\s*\)/g;
const REFERENCE_LINK = /^([ \t]{0,3}\[[^\]]+\]:[ \t]*)(\S+)/gm;
const BASE64_URL_UNSAFE = /[+/]/g;
const BASE64_PADDING = /=+$/;
const BASE64_URL_REPLACEMENTS: Record<string, string> = { "+": "-", "/": "_" };

export function mintJourneyId(): string {
  const bytes = new Uint8Array(JOURNEY_ID_BYTES);
  globalThis.crypto.getRandomValues(bytes);

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(BASE64_URL_UNSAFE, (char) => BASE64_URL_REPLACEMENTS[char] ?? char)
    .replace(BASE64_PADDING, "");
}

function toUrl(input: Request | URL | string): URL | null {
  if (typeof input === "string") {
    try {
      return new URL(input, RESOLVE_BASE);
    } catch {
      return null;
    }
  }

  if (input instanceof URL) {
    return input;
  }

  try {
    return new URL(input.url);
  } catch {
    return null;
  }
}

export function getJourneyId(request: Request | URL | string): string | null {
  const url = toUrl(request);
  const value = url?.searchParams.get(JOURNEY_ID_PARAM);
  if (!value || !JOURNEY_ID_PATTERN.test(value)) {
    return null;
  }
  return value;
}

function tagText(
  text: string,
  journeyId: string,
  host: string | undefined
): string {
  const withInlineLinks = text.replace(
    INLINE_LINK,
    (match, bang: string, label: string, target: string, title: string) => {
      if (bang === "!" || !isTaggableTarget(target, host)) {
        return match;
      }
      return `[${label}](${appendJourneyParam(target, journeyId)}${title})`;
    }
  );

  return withInlineLinks.replace(
    REFERENCE_LINK,
    (match, prefix: string, target: string) => {
      if (!isTaggableTarget(target, host)) {
        return match;
      }
      return `${prefix}${appendJourneyParam(target, journeyId)}`;
    }
  );
}

function tagSegment(
  segment: string,
  journeyId: string,
  host: string | undefined
): string {
  return segment
    .split(INLINE_CODE_SPLIT)
    .map((part) =>
      part.startsWith("`") ? part : tagText(part, journeyId, host)
    )
    .join("");
}

export function tagMarkdownLinks(
  markdown: string,
  journeyId: string,
  options: TagMarkdownLinksOptions = {}
): string {
  if (!JOURNEY_ID_PATTERN.test(journeyId)) {
    return markdown;
  }

  return markdown
    .split(FENCE_SPLIT)
    .map((segment) => {
      const isFence = segment.startsWith("```") || segment.startsWith("~~~");
      return isFence ? segment : tagSegment(segment, journeyId, options.host);
    })
    .join("");
}
