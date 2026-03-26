import type { ReactNode } from "react";

const BOLD_RE = /\*\*(.+?)\*\*/g;
const ITALIC_RE = /\*(.+?)\*/g;
const HASHTAG_RE = /(^|\s)(#\w+)/g;
const BULLET_RE = /^[-*]\s+/;

export function highlightHashtags(text: string, startKey: number): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let keyIdx = startKey;

  HASHTAG_RE.lastIndex = 0;
  let match = HASHTAG_RE.exec(text);
  while (match) {
    const prefix = match[1] ?? "";
    const hashtag = match[2] ?? "";
    const beforeEnd = match.index + prefix.length;

    if (lastIndex < beforeEnd) {
      parts.push(text.slice(lastIndex, beforeEnd));
    }
    parts.push(
      <span className="text-primary" key={`h-${keyIdx++}`}>
        {hashtag}
      </span>
    );
    lastIndex = match.index + match[0].length;
    match = HASHTAG_RE.exec(text);
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function inlineMarkdown(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    const boldMatch = BOLD_RE.exec(remaining);
    BOLD_RE.lastIndex = 0;

    if (boldMatch?.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(
          ...highlightHashtags(remaining.slice(0, boldMatch.index), keyIdx)
        );
        keyIdx += 10;
      }
      parts.push(<strong key={`b-${keyIdx++}`}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    const italicMatch = ITALIC_RE.exec(remaining);
    ITALIC_RE.lastIndex = 0;

    if (italicMatch?.index !== undefined) {
      if (italicMatch.index > 0) {
        parts.push(
          ...highlightHashtags(remaining.slice(0, italicMatch.index), keyIdx)
        );
        keyIdx += 10;
      }
      parts.push(<em key={`i-${keyIdx++}`}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
      continue;
    }

    parts.push(...highlightHashtags(remaining, keyIdx));
    break;
  }

  return parts;
}

const BOLD_LABEL_RE = /\*\*[^*]+\*\*/g;

function splitBoldSections(line: string): string[] {
  const matches: number[] = [];
  BOLD_LABEL_RE.lastIndex = 0;
  let m = BOLD_LABEL_RE.exec(line);
  while (m) {
    matches.push(m.index);
    m = BOLD_LABEL_RE.exec(line);
  }

  if (matches.length <= 1) {
    return [line];
  }

  const segments: string[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i];
    const end = i + 1 < matches.length ? matches[i + 1] : line.length;
    const segment = line.slice(start, end).trim();
    if (segment) {
      segments.push(segment);
    }
  }

  if (matches[0] !== undefined && matches[0] > 0) {
    const before = line.slice(0, matches[0]).trim();
    if (before) {
      segments.unshift(before);
    }
  }

  return segments;
}

export function markdownToElements(markdown: string): ReactNode {
  const lines = markdown.split("\n");
  const elements: ReactNode[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length === 0) {
      return;
    }
    elements.push(
      <ul key={`ul-${elements.length}`}>
        {bulletBuffer.map((item, idx) => (
          <li key={`li-${idx}-${item.slice(0, 20)}`}>{inlineMarkdown(item)}</li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      flushBullets();
      continue;
    }

    if (BULLET_RE.test(trimmed)) {
      bulletBuffer.push(trimmed.replace(BULLET_RE, ""));
      continue;
    }

    flushBullets();
    for (const segment of splitBoldSections(trimmed)) {
      elements.push(
        <p key={`p-${elements.length}`}>{inlineMarkdown(segment)}</p>
      );
    }
  }

  flushBullets();
  return elements;
}
