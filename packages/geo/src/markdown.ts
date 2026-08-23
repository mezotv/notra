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
  const output: string[] = [];
  let outputStart = 0;
  let searchFrom = 0;

  while (searchFrom < text.length) {
    const labelStart = text.indexOf("[", searchFrom);
    if (labelStart === -1) {
      break;
    }

    const labelEnd = text.indexOf("]", labelStart + 1);
    if (labelEnd === -1) {
      break;
    }
    if (text[labelEnd + 1] !== "(") {
      searchFrom = labelEnd + 1;
      continue;
    }

    let cursor = labelEnd + 2;
    while (text[cursor]?.trim() === "") {
      cursor += 1;
    }

    const targetStart = cursor;
    while (
      cursor < text.length &&
      text[cursor]?.trim() !== "" &&
      text[cursor] !== "(" &&
      text[cursor] !== ")"
    ) {
      cursor += 1;
    }
    if (cursor === targetStart) {
      searchFrom = labelEnd + 1;
      continue;
    }

    const targetEnd = cursor;
    while (text[cursor]?.trim() === "") {
      cursor += 1;
    }

    let titleEnd = targetEnd;
    if (cursor > targetEnd && text[cursor] === '"') {
      cursor += 1;
      while (cursor < text.length && text[cursor] !== '"') {
        cursor += 1;
      }
      if (cursor === text.length) {
        searchFrom = labelEnd + 1;
        continue;
      }

      cursor += 1;
      titleEnd = cursor;
      while (text[cursor]?.trim() === "") {
        cursor += 1;
      }
    }

    if (text[cursor] !== ")") {
      searchFrom = labelEnd + 1;
      continue;
    }

    const matchEnd = cursor + 1;
    const target = text.slice(targetStart, targetEnd);
    const isImage = labelStart > 0 && text[labelStart - 1] === "!";
    if (isImage || !isTaggableTarget(target, host)) {
      searchFrom = matchEnd;
      continue;
    }

    const label = text.slice(labelStart + 1, labelEnd);
    const title = text.slice(targetEnd, titleEnd);
    output.push(
      text.slice(outputStart, labelStart),
      `[${label}](${appendJourneyParam(target, journeyId)}${title})`
    );
    outputStart = matchEnd;
    searchFrom = matchEnd;
  }

  output.push(text.slice(outputStart));
  const withInlineLinks = output.join("");

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
