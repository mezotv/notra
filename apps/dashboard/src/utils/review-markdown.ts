import type { ReviewDiffSegment } from "@/types/content/review-markdown";

const TOKEN_SPLIT_RE = /(\s+|[^\w\s]+)/;
const WORD_CHAR_RE = /\w/;
const MAX_LCS_CELLS = 4_000_000;
const ADD_MARK = "==";
const REMOVE_MARK = "~~";
const ADD_MARK_RE = /==([\s\S]*?)==/g;
const REMOVE_MARK_RE = /~~([\s\S]*?)~~/g;

function tokenize(value: string): string[] {
  return value.split(TOKEN_SPLIT_RE).filter((token) => token.length > 0);
}

function mergeSegments(segments: ReviewDiffSegment[]): ReviewDiffSegment[] {
  const merged: ReviewDiffSegment[] = [];
  for (const segment of segments) {
    if (!segment.value) {
      continue;
    }
    const last = merged.at(-1);
    if (last && last.kind === segment.kind) {
      last.value += segment.value;
      continue;
    }
    merged.push({ ...segment });
  }
  return merged;
}

function lcsDiff(
  oldTokens: string[],
  newTokens: string[]
): ReviewDiffSegment[] {
  const oldLength = oldTokens.length;
  const newLength = newTokens.length;
  const cols = newLength + 1;
  const table = new Uint16Array((oldLength + 1) * cols);

  for (let oldIndex = 1; oldIndex <= oldLength; oldIndex += 1) {
    const oldToken = oldTokens[oldIndex - 1];
    const rowOffset = oldIndex * cols;
    const prevRowOffset = (oldIndex - 1) * cols;
    for (let newIndex = 1; newIndex <= newLength; newIndex += 1) {
      table[rowOffset + newIndex] =
        oldToken === newTokens[newIndex - 1]
          ? (table[prevRowOffset + newIndex - 1] ?? 0) + 1
          : Math.max(
              table[prevRowOffset + newIndex] ?? 0,
              table[rowOffset + newIndex - 1] ?? 0
            );
    }
  }

  const segments: ReviewDiffSegment[] = [];
  let oldIndex = oldLength;
  let newIndex = newLength;
  while (oldIndex > 0 || newIndex > 0) {
    if (
      oldIndex > 0 &&
      newIndex > 0 &&
      oldTokens[oldIndex - 1] === newTokens[newIndex - 1]
    ) {
      segments.push({ kind: "equal", value: oldTokens[oldIndex - 1] ?? "" });
      oldIndex -= 1;
      newIndex -= 1;
      continue;
    }
    if (
      newIndex > 0 &&
      (oldIndex === 0 ||
        (table[oldIndex * cols + newIndex - 1] ?? 0) >=
          (table[(oldIndex - 1) * cols + newIndex] ?? 0))
    ) {
      segments.push({ kind: "add", value: newTokens[newIndex - 1] ?? "" });
      newIndex -= 1;
      continue;
    }
    segments.push({ kind: "remove", value: oldTokens[oldIndex - 1] ?? "" });
    oldIndex -= 1;
  }

  return mergeSegments(segments.reverse());
}

function splitCommonLineEnds(previous: string, updated: string) {
  const oldLines = previous.split("\n");
  const newLines = updated.split("\n");

  let prefixCount = 0;
  while (
    prefixCount < oldLines.length &&
    prefixCount < newLines.length &&
    oldLines[prefixCount] === newLines[prefixCount]
  ) {
    prefixCount += 1;
  }

  let oldSuffix = oldLines.length;
  let newSuffix = newLines.length;
  while (
    oldSuffix > prefixCount &&
    newSuffix > prefixCount &&
    oldLines[oldSuffix - 1] === newLines[newSuffix - 1]
  ) {
    oldSuffix -= 1;
    newSuffix -= 1;
  }

  return {
    prefix: oldLines.slice(0, prefixCount).join("\n"),
    oldMid: oldLines.slice(prefixCount, oldSuffix).join("\n"),
    newMid: newLines.slice(prefixCount, newSuffix).join("\n"),
    suffix: oldLines.slice(oldSuffix).join("\n"),
    hasPrefix: prefixCount > 0,
    hasSuffix: oldSuffix < oldLines.length,
  };
}

function diffReviewMarkdown(
  previous: string,
  updated: string
): ReviewDiffSegment[] {
  if (previous === updated) {
    return previous ? [{ kind: "equal", value: previous }] : [];
  }

  const oldTokens = tokenize(previous);
  const newTokens = tokenize(updated);
  if (oldTokens.length * newTokens.length > MAX_LCS_CELLS) {
    return [
      { kind: "remove", value: previous },
      { kind: "add", value: updated },
    ];
  }

  return lcsDiff(oldTokens, newTokens);
}

function wrapChanged(kind: "add" | "remove", value: string): string {
  if (!WORD_CHAR_RE.test(value)) {
    return value;
  }

  const mark = kind === "add" ? ADD_MARK : REMOVE_MARK;
  return value
    .split("\n")
    .map((line) => (WORD_CHAR_RE.test(line) ? `${mark}${line}${mark}` : line))
    .join("\n");
}

function joinReviewParts(parts: string[]): string {
  return parts.join("\n");
}

function markHunk(previous: string, updated: string): string {
  return diffReviewMarkdown(previous, updated)
    .map((segment) => {
      if (segment.kind === "equal") {
        return segment.value;
      }
      return wrapChanged(segment.kind, segment.value);
    })
    .join("");
}

export function buildReviewMarkdown(previous: string, updated: string): string {
  if (!previous || previous === updated) {
    return updated;
  }

  const { prefix, oldMid, newMid, suffix, hasPrefix, hasSuffix } =
    splitCommonLineEnds(previous, updated);

  if (!oldMid && !newMid) {
    return updated;
  }

  const markedMid = markHunk(oldMid, newMid);
  const parts: string[] = [];
  if (hasPrefix) {
    parts.push(prefix);
  }
  parts.push(markedMid);
  if (hasSuffix) {
    parts.push(suffix);
  }

  return joinReviewParts(parts);
}

export function stripReviewMarks(markdown: string): string {
  return markdown.replace(REMOVE_MARK_RE, "").replace(ADD_MARK_RE, "$1");
}
