import type {
  IrisImageMarker,
  IrisImageResolution,
} from "@notra/ai/types/autonomy-capabilities";

const IRIS_IMAGE_MARKER_PATTERN =
  /^[^\S\r\n]*\[iris-image:([^\]\r\n]*)\][^\S\r\n]*$/gm;
const COLLAPSE_BLANK_LINES_PATTERN = /\n{3,}/g;
const MARKDOWN_ALT_TEXT_ESCAPE_PATTERN = /([\\[\]])/g;
const MARKDOWN_URL_UNSAFE_PATTERN = /[\s()]/;

export const IRIS_IMAGE_MARKER_PREFIX = "[iris-image:";

export const parseIrisImageMarkers = (markdown: string): IrisImageMarker[] => {
  const markers: IrisImageMarker[] = [];
  const pattern = new RegExp(
    IRIS_IMAGE_MARKER_PATTERN.source,
    IRIS_IMAGE_MARKER_PATTERN.flags
  );

  let match = pattern.exec(markdown);
  while (match !== null) {
    const description = (match[1] ?? "").trim();
    if (description.length > 0) {
      markers.push({
        index: markers.length,
        raw: match[0],
        description,
      });
    }
    match = pattern.exec(markdown);
  }

  return markers;
};

export const applyIrisImageResolutions = (
  markdown: string,
  resolutions: readonly IrisImageResolution[]
): string => {
  const replacementByIndex = new Map<number, string | null>(
    resolutions.map((resolution) => [resolution.index, resolution.replacement])
  );
  const pattern = new RegExp(
    IRIS_IMAGE_MARKER_PATTERN.source,
    IRIS_IMAGE_MARKER_PATTERN.flags
  );

  let markerIndex = 0;
  const replaced = markdown.replace(
    pattern,
    (_matched, description: string) => {
      if (description.trim().length === 0) {
        return "";
      }
      const currentIndex = markerIndex;
      markerIndex += 1;
      if (!replacementByIndex.has(currentIndex)) {
        return "";
      }
      return replacementByIndex.get(currentIndex) ?? "";
    }
  );

  return replaced.replace(COLLAPSE_BLANK_LINES_PATTERN, "\n\n").trim();
};

export const stripIrisImageMarkers = (markdown: string): string =>
  applyIrisImageResolutions(markdown, []);

export const buildIrisImageMarkdown = (params: {
  altText: string;
  imageUrl: string;
}): string => {
  const altText = params.altText.replace(
    MARKDOWN_ALT_TEXT_ESCAPE_PATTERN,
    "\\$1"
  );
  const imageUrl = MARKDOWN_URL_UNSAFE_PATTERN.test(params.imageUrl)
    ? `<${params.imageUrl}>`
    : params.imageUrl;

  return `![${altText}](${imageUrl})`;
};
