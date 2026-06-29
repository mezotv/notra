import "server-only";

import sanitizeHtml, { type IOptions } from "sanitize-html";

const SVG_ROOT_TAG_REGEX = /<svg[\s>]/i;

export class SvgSanitizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SvgSanitizationError";
  }
}

const SVG_SANITIZE_OPTIONS = {
  allowedTags: [
    "a",
    "circle",
    "clipPath",
    "defs",
    "desc",
    "ellipse",
    "feBlend",
    "feColorMatrix",
    "feComposite",
    "feDropShadow",
    "feFlood",
    "feGaussianBlur",
    "feMerge",
    "feMergeNode",
    "feOffset",
    "filter",
    "g",
    "line",
    "linearGradient",
    "marker",
    "mask",
    "metadata",
    "path",
    "pattern",
    "polygon",
    "polyline",
    "radialGradient",
    "rect",
    "stop",
    "svg",
    "symbol",
    "text",
    "textPath",
    "title",
    "tspan",
    "use",
  ],
  allowedAttributes: {
    "*": [
      "alignment-baseline",
      "aria-hidden",
      "aria-label",
      "baseline-shift",
      "class",
      "clip-path",
      "clip-rule",
      "color",
      "color-interpolation-filters",
      "cx",
      "cy",
      "d",
      "dx",
      "dy",
      "fill",
      "fill-opacity",
      "fill-rule",
      "filter",
      "filterUnits",
      "font-family",
      "font-size",
      "font-style",
      "font-weight",
      "gradientTransform",
      "gradientUnits",
      "height",
      "id",
      "mask",
      "maskUnits",
      "offset",
      "opacity",
      "pathLength",
      "patternContentUnits",
      "patternTransform",
      "patternUnits",
      "points",
      "preserveAspectRatio",
      "r",
      "role",
      "rx",
      "ry",
      "spreadMethod",
      "stop-color",
      "stop-opacity",
      "stroke",
      "stroke-dasharray",
      "stroke-dashoffset",
      "stroke-linecap",
      "stroke-linejoin",
      "stroke-miterlimit",
      "stroke-opacity",
      "stroke-width",
      "transform",
      "transform-origin",
      "vector-effect",
      "viewBox",
      "width",
      "x",
      "x1",
      "x2",
      "y",
      "y1",
      "y2",
    ],
  },
  allowedSchemes: [],
  disallowedTagsMode: "discard",
  parser: {
    lowerCaseAttributeNames: false,
    lowerCaseTags: false,
  },
} satisfies IOptions;

export async function sanitizeSvg(input: string): Promise<string> {
  if (!SVG_ROOT_TAG_REGEX.test(input)) {
    throw new SvgSanitizationError("Payload does not contain an <svg> root");
  }

  const sanitized = sanitizeHtml(input, SVG_SANITIZE_OPTIONS);

  if (!SVG_ROOT_TAG_REGEX.test(sanitized)) {
    throw new SvgSanitizationError("SVG is empty after sanitization");
  }

  return sanitized;
}
