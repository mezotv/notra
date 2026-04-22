import "server-only";
import DOMPurify from "isomorphic-dompurify";

const SVG_ROOT_TAG_REGEX = /<svg[\s>]/i;

export class SvgSanitizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SvgSanitizationError";
  }
}

export function sanitizeSvg(input: string): string {
  if (!SVG_ROOT_TAG_REGEX.test(input)) {
    throw new SvgSanitizationError("Payload does not contain an <svg> root");
  }

  const sanitized = DOMPurify.sanitize(input, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ["script", "foreignObject", "iframe", "object", "embed"],
    FORBID_ATTR: ["href", "xlink:href"],
    KEEP_CONTENT: false,
  });

  if (!SVG_ROOT_TAG_REGEX.test(sanitized)) {
    throw new SvgSanitizationError("SVG is empty after sanitization");
  }

  return sanitized;
}
