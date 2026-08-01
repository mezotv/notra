const HEADING_PATTERN = /^#{1,6}\s+(.+)$/m;
const MARKDOWN_NOISE_PATTERN = /[#>*_`~[\]()!]/g;
const WHITESPACE_PATTERN = /\s+/g;
const CODE_FENCE_PATTERN = /```[\s\S]*?```/g;
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*\]\(<?(https?:\/\/[^\s)>]+)>?\)/;

export const IRIS_TITLE_MAX_LENGTH = 120;
export const IRIS_EXCERPT_MAX_LENGTH = 200;

const truncate = (value: string, maxLength: number): string =>
  value.length <= maxLength
    ? value
    : `${value.slice(0, maxLength - 1).trim()}…`;

export const extractMarkdownTitle = (
  markdown: string,
  fallback: string
): string => {
  const heading = HEADING_PATTERN.exec(markdown)?.[1]?.trim();
  if (heading && heading.length > 0) {
    return truncate(heading, IRIS_TITLE_MAX_LENGTH);
  }

  const firstLine = markdown
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  const sanitizedFirstLine = firstLine
    ? firstLine.replace(MARKDOWN_NOISE_PATTERN, "").trim()
    : "";

  if (sanitizedFirstLine.length > 0) {
    return truncate(sanitizedFirstLine, IRIS_TITLE_MAX_LENGTH);
  }

  return truncate(fallback, IRIS_TITLE_MAX_LENGTH);
};

export const extractFirstMarkdownImageUrl = (markdown: string): string | null =>
  MARKDOWN_IMAGE_PATTERN.exec(markdown)?.[1] ?? null;

export const buildMarkdownExcerpt = (markdown: string): string => {
  const plain = markdown
    .replace(CODE_FENCE_PATTERN, " ")
    .replace(MARKDOWN_NOISE_PATTERN, " ")
    .replace(WHITESPACE_PATTERN, " ")
    .trim();

  return truncate(plain, IRIS_EXCERPT_MAX_LENGTH);
};
