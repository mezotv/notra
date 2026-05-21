import {
  COLLAPSIBLE_TEXT_RE,
  CSS_PROPERTY_WORD_RE,
  FONT_FAMILY_QUOTES_RE,
  HEX_RE,
  LAYER_WORD_SPLIT_RE,
  MAX_LAYER_NAME_LENGTH,
  PAPER_FILE_ID,
  PAPER_ROOT_NODE_ID,
  PAPER_TEXT_WIDTH_ALLOWANCE,
  PRE_LINE_BREAK_RE,
  PRE_LINE_SPACE_RE,
  RGB_RE,
  ULID_ALPHABET,
  WHITESPACE_GLOBAL_RE,
} from "../constants/paper";
import type {
  BorderSide,
  BoxBorders,
  BuildPaperPasteHtmlOptions,
  PaperBorder,
  PaperColor,
  PaperEmbedData,
  PaperFont,
  PaperNode,
  PaperPaint,
} from "../types/paper";

export type { BuildPaperPasteHtmlOptions } from "../types/paper";

function isWhitespaceText(node: ChildNode): boolean {
  return (
    node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim() === ""
  );
}

function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

function paperRootElement(
  element: HTMLElement,
  unwrapSingleChild: boolean
): HTMLElement {
  if (!unwrapSingleChild) {
    return element;
  }

  const meaningfulChildren = Array.from(element.childNodes).filter(
    (node) => !isWhitespaceText(node) && node.nodeType !== Node.COMMENT_NODE
  );
  const onlyChild = meaningfulChildren[0];

  if (meaningfulChildren.length === 1 && onlyChild instanceof HTMLElement) {
    return onlyChild;
  }

  return element;
}

function paperLabel(
  element: HTMLElement,
  options: BuildPaperPasteHtmlOptions
): string {
  const label =
    options.label ??
    options.name ??
    element.getAttribute("aria-label") ??
    element.getAttribute("data-name") ??
    element.id;
  const trimmed = label?.trim();
  return trimmed || "Frame";
}

function randomIndex(): number {
  const crypto = globalThis.crypto;
  if (crypto) {
    const bytes = new Uint8Array(1);
    crypto.getRandomValues(bytes);
    return (bytes[0] ?? 0) % ULID_ALPHABET.length;
  }

  return Math.floor(Math.random() * ULID_ALPHABET.length);
}

function createPaperId(): string {
  const timeChars: string[] = [];
  let timestamp = Date.now();

  for (let index = 0; index < 10; index += 1) {
    timeChars.unshift(ULID_ALPHABET[timestamp % ULID_ALPHABET.length] ?? "0");
    timestamp = Math.floor(timestamp / ULID_ALPHABET.length);
  }

  let randomChars = "";
  for (let index = 0; index < 16; index += 1) {
    randomChars += ULID_ALPHABET[randomIndex()] ?? "0";
  }

  return `${timeChars.join("")}${randomChars}`;
}

function commentSafeJson(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("--", "-\\u002d");
}

function parseColor(s: string): [number, number, number, number] | null {
  if (!s) {
    return null;
  }
  const trimmed = s.trim();
  const hex = HEX_RE.exec(trimmed);
  if (hex?.[1]) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) {
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    }
    if (h.length !== 6 && h.length !== 8) {
      return null;
    }
    const r = Number.parseInt(h.slice(0, 2), 16) / 255;
    const g = Number.parseInt(h.slice(2, 4), 16) / 255;
    const b = Number.parseInt(h.slice(4, 6), 16) / 255;
    const a = h.length === 8 ? Number.parseInt(h.slice(6, 8), 16) / 255 : 1;
    return [r, g, b, a];
  }

  const match = RGB_RE.exec(trimmed);
  const inner = match?.[1];
  if (!inner) {
    return null;
  }
  const parts = inner.split(",").map((part) => part.trim());
  const [rs, gs, bs, as] = parts;
  if (rs === undefined || gs === undefined || bs === undefined) {
    return null;
  }
  const r = Number.parseFloat(rs) / 255;
  const g = Number.parseFloat(gs) / 255;
  const b = Number.parseFloat(bs) / 255;
  const a = as !== undefined ? Number.parseFloat(as) : 1;
  return [r, g, b, a];
}

function srgbToLinear(value: number): number {
  return value <= 0.040_45 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function paperColorFromCss(value: string): PaperColor {
  const parsed = parseColor(value) ?? [0, 0, 0, 0];
  const [srgbR, srgbG, srgbB, alpha] = parsed;
  const r = srgbToLinear(srgbR);
  const g = srgbToLinear(srgbG);
  const b = srgbToLinear(srgbB);

  const lmsL = Math.cbrt(
    0.412_221_470_8 * r + 0.536_332_536_3 * g + 0.051_445_992_9 * b
  );
  const lmsM = Math.cbrt(
    0.211_903_498_2 * r + 0.680_699_545_1 * g + 0.107_396_956_6 * b
  );
  const lmsS = Math.cbrt(
    0.088_302_461_9 * r + 0.281_718_837_6 * g + 0.629_978_700_5 * b
  );

  const l =
    0.210_454_255_3 * lmsL + 0.793_617_785 * lmsM - 0.004_072_046_8 * lmsS;
  const a =
    1.977_998_495_1 * lmsL - 2.428_592_205 * lmsM + 0.450_593_709_9 * lmsS;
  const labB =
    0.025_904_037_1 * lmsL + 0.782_771_766_2 * lmsM - 0.808_675_766 * lmsS;
  const h = (Math.atan2(labB, a) * 180) / Math.PI;

  return {
    mode: "hex",
    value: {
      ...(alpha < 1 ? { alpha } : {}),
      c: Math.sqrt(a * a + labB * labB),
      h: h < 0 ? h + 360 : h,
      l,
      mode: "oklch",
    },
  };
}

function cleanLayerName(input: string | null | undefined): string | null {
  const cleaned = input?.replace(WHITESPACE_GLOBAL_RE, " ").trim();
  if (!cleaned) {
    return null;
  }
  if (cleaned.length <= MAX_LAYER_NAME_LENGTH) {
    return cleaned;
  }
  return `${cleaned.slice(0, MAX_LAYER_NAME_LENGTH - 3).trim()}...`;
}

function titleCase(input: string): string {
  return input
    .split(LAYER_WORD_SPLIT_RE)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function leadingCommentName(el: Element): string | null {
  let sibling = el.previousSibling;
  while (sibling) {
    if (sibling.nodeType === Node.TEXT_NODE) {
      if ((sibling.textContent ?? "").trim() === "") {
        sibling = sibling.previousSibling;
        continue;
      }
      return null;
    }
    if (sibling.nodeType === Node.COMMENT_NODE) {
      return cleanLayerName(sibling.textContent);
    }
    return null;
  }
  return null;
}

function explicitElementName(el: Element): string | null {
  return (
    cleanLayerName(el.getAttribute("data-figma-name")) ??
    cleanLayerName(el.getAttribute("data-layer-name")) ??
    cleanLayerName(el.getAttribute("aria-label")) ??
    cleanLayerName(el.getAttribute("title"))
  );
}

function compactText(input: string | null | undefined): string | null {
  return cleanLayerName(input);
}

function compactElementText(el: Element): string | null {
  const text = compactText(el.textContent);
  if (!text) {
    return null;
  }
  if (text.length > 48) {
    return null;
  }
  if (el.children.length > 1 && text.length > 24) {
    return null;
  }
  return text;
}

function borderSide(
  style: CSSStyleDeclaration,
  side: "Top" | "Right" | "Bottom" | "Left"
): BorderSide {
  return {
    color: style.getPropertyValue(`border-${side.toLowerCase()}-color`),
    width: Number.parseFloat(
      style.getPropertyValue(`border-${side.toLowerCase()}-width`) || "0"
    ),
  };
}

function boxBorders(style: CSSStyleDeclaration): BoxBorders {
  return {
    bottom: borderSide(style, "Bottom"),
    left: borderSide(style, "Left"),
    right: borderSide(style, "Right"),
    top: borderSide(style, "Top"),
  };
}

function uniformBorder(borders: BoxBorders): BorderSide | null {
  const { top, right, bottom, left } = borders;
  if (
    top.width === right.width &&
    top.width === bottom.width &&
    top.width === left.width &&
    top.color === right.color &&
    top.color === bottom.color &&
    top.color === left.color &&
    top.width > 0
  ) {
    return top;
  }
  return null;
}

function cornerRadii(
  style: CSSStyleDeclaration
): [number, number, number, number] {
  return [
    Number.parseFloat(style.borderTopLeftRadius || "0"),
    Number.parseFloat(style.borderTopRightRadius || "0"),
    Number.parseFloat(style.borderBottomRightRadius || "0"),
    Number.parseFloat(style.borderBottomLeftRadius || "0"),
  ];
}

function textLayerName(
  text: string,
  fontSize: number,
  fontWeight: string,
  parentTag: string
): string {
  const label = compactText(text) ?? "Text";
  const parsedWeight = Number.parseInt(fontWeight, 10);
  let weight = 400;
  if (Number.isFinite(parsedWeight)) {
    weight = parsedWeight;
  } else if (fontWeight === "bold") {
    weight = 700;
  }

  if (fontSize >= 28) {
    return `Heading - ${label}`;
  }
  if (parentTag === "p") {
    return `Paragraph - ${label}`;
  }
  if (weight >= 600 || parentTag === "button") {
    return `Label - ${label}`;
  }
  return `Text - ${label}`;
}

function elementFallbackName(
  el: Element,
  tag: string,
  style: CSSStyleDeclaration
): string {
  const role = cleanLayerName(el.getAttribute("role"));
  if (role) {
    return titleCase(role);
  }

  const text = compactElementText(el);
  if (tag === "p") {
    return text ? `Paragraph - ${text}` : "Paragraph";
  }
  if (tag === "span") {
    if (!text && el.children.length === 0) {
      return "Spacer";
    }
    return text ? `Text Wrapper - ${text}` : "Text Wrapper";
  }
  if (tag === "button") {
    return text ? `Button - ${text}` : "Button";
  }
  if (tag === "a") {
    return text ? `Link - ${text}` : "Link";
  }
  if (tag === "svg") {
    return "SVG";
  }
  if (tag !== "div") {
    return titleCase(tag);
  }

  const rect = el.getBoundingClientRect();
  const bg = parseColor(style.backgroundColor);
  const hasBackground = Boolean(bg && bg[3] > 0);
  const hasBorder = Boolean(uniformBorder(boxBorders(style)));
  const maxRadius = Math.max(...cornerRadii(style));
  const isDot =
    rect.width <= 18 &&
    rect.height <= 18 &&
    maxRadius >= Math.min(rect.width, rect.height) / 2 - 0.5;
  const isLine =
    hasBackground && rect.height <= 16 && rect.width >= rect.height * 4;

  if (text) {
    return `Group - ${text}`;
  }
  if (isDot) {
    return "Browser Dot";
  }
  if (isLine) {
    return "Content Line";
  }
  if (hasBorder && hasBackground) {
    return "Card";
  }
  if (hasBorder) {
    return "Container";
  }
  if (hasBackground && el.children.length === 0) {
    if (rect.width >= 100 && rect.height >= 100) {
      return "Background Block";
    }
    return "Shape";
  }
  if (hasBackground) {
    return "Background";
  }
  if (style.display === "flex" || style.display === "inline-flex") {
    return style.flexDirection === "row" ? "Row" : "Stack";
  }
  return "Group";
}

function elementLayerName(
  el: Element,
  style: CSSStyleDeclaration,
  rootName?: string
): string {
  if (rootName) {
    return rootName;
  }

  return (
    explicitElementName(el) ??
    leadingCommentName(el) ??
    elementFallbackName(el, el.tagName.toLowerCase(), style)
  );
}

function cssPropertyToPaperKey(property: string): string {
  if (property.startsWith("-webkit-")) {
    return `Webkit${property
      .slice("-webkit-".length)
      .replaceAll(CSS_PROPERTY_WORD_RE, (_, char: string) =>
        char.toUpperCase()
      )}`;
  }

  return property.replaceAll(CSS_PROPERTY_WORD_RE, (_, char: string) =>
    char.toUpperCase()
  );
}

function computedStyles(
  style: CSSStyleDeclaration
): Record<string, string | number> {
  const styles: Record<string, string | number> = {};
  for (let index = 0; index < style.length; index += 1) {
    const property = style.item(index);
    const value = style.getPropertyValue(property);
    if (!property || !value || property.startsWith("--")) {
      continue;
    }
    styles[cssPropertyToPaperKey(property)] = value;
  }
  return styles;
}

function textStyles(
  style: CSSStyleDeclaration,
  width?: number,
  height?: number
): Record<string, string | number> {
  return {
    fontSize: style.fontSize,
    ...(height !== undefined ? { height } : {}),
    letterSpacing: style.letterSpacing,
    lineHeight: style.lineHeight,
    textAlign: style.textAlign,
    textOverflow: style.textOverflow,
    textTransform: style.textTransform,
    textWrap: style.getPropertyValue("text-wrap") || "auto",
    ...(width !== undefined ? { width } : {}),
  };
}

function normalizeTextValue(text: string, style: CSSStyleDeclaration): string {
  switch (style.whiteSpace) {
    case "pre":
    case "pre-wrap":
    case "break-spaces":
      return text;
    case "pre-line":
      return text
        .split(PRE_LINE_BREAK_RE)
        .map((line) => line.replaceAll(PRE_LINE_SPACE_RE, " ").trim())
        .filter(Boolean)
        .join("\n");
    default:
      return text.replaceAll(COLLAPSIBLE_TEXT_RE, " ").trim();
  }
}

function hasTextNode(element: Element): boolean {
  return Array.from(element.childNodes).some(
    (node) =>
      node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim()
  );
}

function hasElementChild(element: Element): boolean {
  return Array.from(element.childNodes).some(
    (node) => node.nodeType === Node.ELEMENT_NODE
  );
}

function measuredTextBounds(node: Node): { height: number; width: number } {
  const ownerDocument =
    node.ownerDocument ?? (node instanceof Document ? node : document);
  const range = ownerDocument.createRange();
  range.selectNodeContents(node);
  const rect = range.getBoundingClientRect();
  range.detach?.();
  return {
    height: rect.height,
    width: rect.width,
  };
}

function paperTextWidth(width: number): number {
  if (!Number.isFinite(width) || width <= 0) {
    return width;
  }
  return Math.ceil(width * PAPER_TEXT_WIDTH_ALLOWANCE);
}

function applyPaperTextSizing(
  styles: Record<string, string | number>,
  element: Element,
  style: CSSStyleDeclaration
): void {
  if (!hasTextNode(element) || hasElementChild(element)) {
    return;
  }
  if (
    style.whiteSpace === "pre-wrap" ||
    style.whiteSpace === "pre-line" ||
    style.whiteSpace === "break-spaces"
  ) {
    return;
  }

  const rect = element.getBoundingClientRect();
  const width = paperTextWidth(rect.width);
  if (Number.isFinite(width) && width > rect.width) {
    styles.width = width;
    styles.inlineSize = width;
  }
}

function paintFromCss(value: string): PaperPaint | null {
  const parsed = parseColor(value);
  if (!parsed || parsed[3] <= 0) {
    return null;
  }
  return {
    color: paperColorFromCss(value),
    isVisible: true,
    type: "solid",
  };
}

function paperBorder(style: CSSStyleDeclaration): PaperBorder {
  const width = style.borderTopWidth || "0px";
  const numericWidth = Number.parseFloat(width);
  return {
    color: paperColorFromCss(style.borderTopColor || "rgb(229, 229, 229)"),
    isVisible: numericWidth > 0 && style.borderTopStyle !== "none",
    style: style.borderTopStyle || "solid",
    type: "color",
    width,
  };
}

function htmlStyleMeta(style: CSSStyleDeclaration): PaperNode["styleMeta"] {
  const fill = paintFromCss(style.backgroundColor);
  const border = paperBorder(style);
  return {
    borders: { all: border },
    ...(fill ? { fill: [fill] } : {}),
  };
}

function parseFontWeight(value: string): number {
  if (value === "bold") {
    return 700;
  }
  if (value === "normal") {
    return 400;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 400;
}

function fontStyleMeta(style: CSSStyleDeclaration): PaperFont {
  const weight = parseFontWeight(style.fontWeight);
  const isItalic = style.fontStyle.includes("italic");
  let fontStyle = "Regular";
  if (isItalic) {
    fontStyle = "Italic";
  } else if (weight >= 700) {
    fontStyle = "Bold";
  }

  return {
    axes: { wght: { max: 900, min: 100, tag: "wght" } },
    coordinates: { wght: weight },
    family:
      style.fontFamily
        .split(",")[0]
        ?.trim()
        .replaceAll(FONT_FAMILY_QUOTES_RE, "") || "Inter",
    isItalic,
    style: fontStyle,
    weight,
  };
}

function textStyleMeta(style: CSSStyleDeclaration): PaperNode["styleMeta"] {
  const fill = paintFromCss(style.color);
  return {
    fill: fill ? [fill] : [],
    font: fontStyleMeta(style),
  };
}

function svgProps(
  element: SVGElement,
  style: CSSStyleDeclaration
): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const attribute of element.getAttributeNames()) {
    const value = element.getAttribute(attribute);
    if (value == null || attribute === "style") {
      continue;
    }
    props[cssPropertyToPaperKey(attribute)] = value;
  }

  const fill = paintFromCss(style.fill);
  const stroke = paintFromCss(style.stroke);
  const color = paintFromCss(style.color);
  if (fill) {
    props.fill = fill;
  }
  if (stroke) {
    props.stroke = stroke;
  }
  if (color) {
    props.color = color;
  }
  props.fontFamily = style.fontFamily;
  props.fontSize = style.fontSize;
  props.fontStyle = style.fontStyle;
  props.fontWeight = style.fontWeight;
  props.letterSpacing = style.letterSpacing;
  props.textDecoration = style.textDecorationLine;
  props.wordSpacing = style.wordSpacing;
  props.writingMode = style.writingMode;
  return props;
}

function hasMeaningfulChildren(element: Element): boolean {
  return Array.from(element.childNodes).some(
    (node) =>
      node.nodeType === Node.ELEMENT_NODE ||
      (node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim())
  );
}

function isSvgElement(element: Element): element is SVGElement {
  return element.namespaceURI === "http://www.w3.org/2000/svg";
}

function nextNodeId(index: number): string {
  const first = String.fromCharCode(65 + Math.floor(index / 26));
  const second = String.fromCharCode(65 + (index % 26));
  return `${first}${second}-0`;
}

function buildPaperEmbedData(
  root: HTMLElement,
  label: string,
  options: BuildPaperPasteHtmlOptions
): PaperEmbedData {
  const nodes: Record<string, PaperNode> = {};
  const parentToChildrenIndex: Record<string, string[]> = {};
  let nodeIndex = 0;

  const createId = (isRoot = false) => {
    if (isRoot) {
      return PAPER_ROOT_NODE_ID;
    }
    const id = nextNodeId(nodeIndex);
    nodeIndex += 1;
    return id;
  };

  function addTextNode(textNode: Text, parentElement: Element): string | null {
    const view = parentElement.ownerDocument.defaultView;
    if (!view) {
      return null;
    }

    const id = createId();
    const style = view.getComputedStyle(parentElement);
    const text = textNode.textContent ?? "";
    const textValue = normalizeTextValue(text, style);
    if (!textValue) {
      return null;
    }
    const bounds = measuredTextBounds(textNode);
    const textWidth = paperTextWidth(bounds.width);

    nodes[id] = {
      "~": false,
      component: "Text",
      id,
      labelIsModified: true,
      label: textLayerName(
        textValue,
        Number.parseFloat(style.fontSize || "0"),
        style.fontWeight,
        parentElement.tagName.toLowerCase()
      ),
      styleMeta: textStyleMeta(style),
      styles: textStyles(
        style,
        Number.isFinite(textWidth) && textWidth > 0 ? textWidth : undefined,
        Number.isFinite(bounds.height) && bounds.height > 0
          ? bounds.height
          : undefined
      ),
      textValue,
    };
    return id;
  }

  function addElementNode(element: Element, isRoot = false): string | null {
    const view = element.ownerDocument.defaultView;
    if (!view) {
      return null;
    }

    const id = createId(isRoot);
    const style = view.getComputedStyle(element);
    const isSvgRoot = element instanceof SVGSVGElement;
    const isSvgChild = isSvgElement(element) && !isSvgRoot;
    let component: PaperNode["component"] = "Rectangle";
    if (isSvgRoot) {
      component = "SVG";
    } else if (isSvgChild) {
      component = "SVGVisualElement";
    } else if (isRoot || hasMeaningfulChildren(element)) {
      component = "Frame";
    }

    const styles = computedStyles(style);
    applyPaperTextSizing(styles, element, style);

    nodes[id] = {
      "~": false,
      component,
      id,
      label: isRoot ? label : elementLayerName(element, style),
      labelIsModified: true,
      ...(isSvgChild ? { tag: element.tagName.toLowerCase() } : {}),
      ...(isSvgElement(element) ? { props: svgProps(element, style) } : {}),
      ...(isSvgChild ? {} : { styleMeta: htmlStyleMeta(style) }),
      styles,
    };

    const childIds: string[] = [];
    for (const child of Array.from(element.childNodes)) {
      if (isTextNode(child)) {
        const childId = addTextNode(child, element);
        if (childId) {
          childIds.push(childId);
        }
        continue;
      }
      if (child instanceof Element) {
        const childId = addElementNode(child);
        if (childId) {
          childIds.push(childId);
        }
      }
    }

    if (childIds.length > 0) {
      parentToChildrenIndex[id] = childIds;
    }
    return id;
  }

  const rootId = addElementNode(root, true);
  if (!rootId) {
    throw new Error("Could not build Paper node graph");
  }

  return {
    fileId: options.fileId ?? PAPER_FILE_ID,
    id: options.pasteId ?? createPaperId(),
    images: {},
    nodes,
    oldIdToNewIdMap: { "F1-0": rootId },
    parentToChildrenIndex,
    positions: { [rootId]: [0, 0] },
    topLevelNodeIds: [rootId],
  };
}

export function buildPaperPasteHtml(
  element: HTMLElement,
  options: BuildPaperPasteHtmlOptions = {}
): string {
  const root = paperRootElement(element, options.unwrapSingleChild ?? true);
  const label = paperLabel(root, options);
  const embedData = commentSafeJson(buildPaperEmbedData(root, label, options));

  return (
    `<meta charset="utf-8">\n<meta charset="utf-8">\n` +
    `<!--<paper-paste-start data-embed="${embedData}"></paper-paste-start>-->` +
    `<span\n  style="white-space:pre-wrap;"\n></span>`
  );
}

export async function copyAsPaper(
  element: HTMLElement,
  options: BuildPaperPasteHtmlOptions = {}
): Promise<void> {
  const root = paperRootElement(element, options.unwrapSingleChild ?? true);
  const label = paperLabel(root, options);
  const html = buildPaperPasteHtml(root, {
    ...options,
    label,
    unwrapSingleChild: false,
  });

  await navigator.clipboard.write([
    new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
    }),
  ]);
}
