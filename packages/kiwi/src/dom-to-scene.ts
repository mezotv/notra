import type { Guid } from "./scene-builder";
import { SceneBuilder, solidFill } from "./scene-builder";
import type { PathSubpath } from "./svg-path";
import { parseSvgPath } from "./svg-path";

const RGB_RE = /rgba?\(([^)]+)\)/;
const HEX_RE = /^#([0-9a-f]{3,8})$/i;

const WEIGHT_TO_STYLE: Record<string, string> = {
  "100": "Thin",
  "200": "Extra Light",
  "300": "Light",
  "400": "Regular",
  normal: "Regular",
  "500": "Medium",
  "600": "Semi Bold",
  "700": "Bold",
  bold: "Bold",
  "800": "Extra Bold",
  "900": "Black",
};

const TEXT_ALIGN_MAP: Record<string, string> = {
  left: "LEFT",
  right: "RIGHT",
  center: "CENTER",
  justify: "JUSTIFIED",
  start: "LEFT",
  end: "RIGHT",
};

const IGNORED_TAGS = new Set(["script", "style", "meta", "link", "head"]);

interface ElementInfo {
  kind: "element";
  tag: string;
  x: number;
  y: number;
  width: number;
  height: number;
  background: string;
  cornerRadii: [number, number, number, number];
  borderColor: string;
  borderWidth: number;
  children: LayoutNode[];
}

interface TextInfo {
  kind: "text";
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  color: string;
  textAlign: string;
  wrapped: boolean;
  parentX: number;
  parentY: number;
  parentWidth: number;
}

interface SvgShape {
  subpaths: PathSubpath[];
  fill: string;
  fillRule: "nonzero" | "evenodd";
}

interface SvgInfo {
  kind: "svg";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  shapes: SvgShape[];
}

type LayoutNode = ElementInfo | TextInfo | SvgInfo;

function parseColor(s: string): [number, number, number, number] | null {
  if (!s) return null;
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
    if (h.length !== 6 && h.length !== 8) return null;
    const r = Number.parseInt(h.slice(0, 2), 16) / 255;
    const g = Number.parseInt(h.slice(2, 4), 16) / 255;
    const b = Number.parseInt(h.slice(4, 6), 16) / 255;
    const a = h.length === 8 ? Number.parseInt(h.slice(6, 8), 16) / 255 : 1;
    return [r, g, b, a];
  }
  const m = RGB_RE.exec(trimmed);
  const inner = m?.[1];
  if (!inner) return null;
  const parts = inner.split(",").map((p) => p.trim());
  const [rs, gs, bs, as] = parts;
  if (rs === undefined || gs === undefined || bs === undefined) return null;
  const r = Number.parseFloat(rs) / 255;
  const g = Number.parseFloat(gs) / 255;
  const b = Number.parseFloat(bs) / 255;
  const a = as !== undefined ? Number.parseFloat(as) : 1;
  return [r, g, b, a];
}

const CSS_GENERIC_FONTS = new Set([
  "sans-serif",
  "serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-sans-serif",
  "ui-serif",
  "ui-monospace",
  "ui-rounded",
  "math",
  "emoji",
  "fangsong",
  "-apple-system",
  "blinkmacsystemfont",
]);

function pickAvailableFont(fontFamily: string, fontSize: number): string {
  const families = fontFamily
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);

  for (const family of families) {
    if (CSS_GENERIC_FONTS.has(family.toLowerCase())) continue;
    try {
      if (document.fonts.check(`${fontSize}px "${family}"`)) {
        return family;
      }
    } catch {
      // ignore
    }
  }
  return "Inter";
}

function parsePx(s: string): number {
  if (!s || s === "normal") return 0;
  const trimmed = s.trim();
  if (trimmed.endsWith("px")) {
    const v = Number.parseFloat(trimmed.slice(0, -2));
    return Number.isFinite(v) ? v : 0;
  }
  const v = Number.parseFloat(trimmed);
  return Number.isFinite(v) ? v : 0;
}

function parseLineHeight(s: string, fontSize: number): number {
  if (!s || s === "normal") return 0;
  const trimmed = s.trim();
  if (trimmed.endsWith("px")) {
    const v = Number.parseFloat(trimmed.slice(0, -2));
    return Number.isFinite(v) ? v : 0;
  }
  const v = Number.parseFloat(trimmed);
  if (!Number.isFinite(v)) return 0;
  return v < 10 ? v * fontSize : v;
}

function parseCornerRadius(s: string): number {
  if (!s) return 0;
  const first = s.trim().split(/\s+/)[0];
  return first ? parsePx(first) : 0;
}

function extractLayout(node: Node): LayoutNode | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.nodeValue ?? "").replace(/\s+/g, " ").trim();
    if (!text) return null;
    const parent = node.parentElement;
    if (!parent) return null;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rect = range.getBoundingClientRect();
    const lineRects = range.getClientRects();
    range.detach?.();
    const parentRect = parent.getBoundingClientRect();
    const style = getComputedStyle(parent);
    return {
      kind: "text",
      text,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      fontFamily: style.fontFamily,
      fontSize: Number.parseFloat(style.fontSize),
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      color: style.color,
      textAlign: style.textAlign,
      wrapped: lineRects.length > 1,
      parentX: parentRect.left,
      parentY: parentRect.top,
      parentWidth: parentRect.width,
    };
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  if (IGNORED_TAGS.has(tag)) return null;

  if (tag === "svg") {
    const svg = el as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const style = getComputedStyle(svg);
    const svgFill = svg.getAttribute("fill") ?? "";
    const fallbackColor =
      (svgFill && svgFill !== "none" && svgFill !== "currentColor"
        ? svgFill
        : "") || style.color;

    const shapes: SvgShape[] = [];
    const pathEls = svg.querySelectorAll("path");
    for (const pathEl of pathEls) {
      const d = pathEl.getAttribute("d");
      if (!d) continue;
      const ctm = pathEl.getScreenCTM();
      if (!ctm) continue;
      const subpaths = parseSvgPath(d);
      if (subpaths.length === 0) continue;
      const pathFill = pathEl.getAttribute("fill") ?? "";
      const fill =
        (pathFill && pathFill !== "none" && pathFill !== "currentColor"
          ? pathFill
          : "") ||
        (svgFill && svgFill !== "none" && svgFill !== "currentColor"
          ? svgFill
          : "") ||
        fallbackColor;
      const fillRule: "nonzero" | "evenodd" =
        pathEl.getAttribute("fill-rule") === "evenodd" ||
        pathEl.getAttribute("clip-rule") === "evenodd"
          ? "evenodd"
          : "nonzero";
      const transformed: PathSubpath[] = subpaths.map((sub) => ({
        closed: sub.closed,
        points: sub.points.map((p) => ({
          x: ctm.a * p.x + ctm.c * p.y + ctm.e,
          y: ctm.b * p.x + ctm.d * p.y + ctm.f,
        })),
      }));
      shapes.push({ subpaths: transformed, fill, fillRule });
    }

    return {
      kind: "svg",
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      color: fallbackColor,
      shapes,
    };
  }

  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  const style = getComputedStyle(el);

  const children: LayoutNode[] = [];
  for (const child of Array.from(el.childNodes)) {
    const c = extractLayout(child);
    if (c) children.push(c);
  }

  const cornerRadii: [number, number, number, number] = [
    parseCornerRadius(style.borderTopLeftRadius),
    parseCornerRadius(style.borderTopRightRadius),
    parseCornerRadius(style.borderBottomRightRadius),
    parseCornerRadius(style.borderBottomLeftRadius),
  ];

  const borderWidth = parsePx(style.borderTopWidth);
  const borderColor =
    borderWidth > 0 && style.borderTopStyle !== "none"
      ? style.borderTopColor
      : "";

  return {
    kind: "element",
    tag,
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
    background: style.backgroundColor,
    cornerRadii,
    borderColor,
    borderWidth,
    children,
  };
}

function emitSvg(
  sb: SceneBuilder,
  svgNode: SvgInfo,
  parent: Guid,
  parentX: number,
  parentY: number
): void {
  for (const shape of svgNode.shapes) {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const sub of shape.subpaths) {
      for (const p of sub.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
    }
    if (!Number.isFinite(minX)) continue;
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);

    const vertices: Array<{ x: number; y: number }> = [];
    const segments: Array<{ vStart: number; vEnd: number }> = [];
    const loops: Array<{ segmentIndices: number[] }> = [];

    for (const sub of shape.subpaths) {
      const startIdx = vertices.length;
      const pts = sub.points;
      let count = pts.length;
      if (count >= 2) {
        const first = pts[0];
        const last = pts[count - 1];
        if (
          sub.closed &&
          first &&
          last &&
          Math.hypot(first.x - last.x, first.y - last.y) < 0.0001
        ) {
          count -= 1;
        }
      }
      for (let i = 0; i < count; i += 1) {
        const p = pts[i];
        if (!p) continue;
        vertices.push({ x: p.x - minX, y: p.y - minY });
      }
      const numVerts = vertices.length - startIdx;
      if (numVerts < 2) continue;
      const segStart = segments.length;
      const lastIdx = numVerts - 1;
      for (let i = 0; i < lastIdx; i += 1) {
        segments.push({ vStart: startIdx + i, vEnd: startIdx + i + 1 });
      }
      if (sub.closed) {
        segments.push({ vStart: startIdx + lastIdx, vEnd: startIdx });
      }
      const loopSegs: number[] = [];
      for (let i = segStart; i < segments.length; i += 1) loopSegs.push(i);
      loops.push({ segmentIndices: loopSegs });
    }

    if (vertices.length < 2 || loops.length === 0) continue;

    const shapeColor = parseColor(shape.fill);
    const fill = shapeColor
      ? solidFill(shapeColor[0], shapeColor[1], shapeColor[2], shapeColor[3])
      : solidFill(0.35, 0.35, 0.4, 1);

    sb.addVector({
      parent,
      name: "path",
      x: minX - parentX,
      y: minY - parentY,
      width,
      height,
      fill,
      network: {
        vertices,
        segments,
        regions: [
          {
            loops,
            windingRule: shape.fillRule === "evenodd" ? "ODD" : "NONZERO",
          },
        ],
      },
    });
  }
}

function emitElement(
  sb: SceneBuilder,
  node: ElementInfo,
  parent: Guid,
  parentX: number,
  parentY: number
): void {
  const relX = node.x - parentX;
  const relY = node.y - parentY;
  const bg = parseColor(node.background);
  const fill = bg && bg[3] > 0 ? solidFill(bg[0], bg[1], bg[2], bg[3]) : null;
  const borderRgba = node.borderColor ? parseColor(node.borderColor) : null;
  const stroke =
    borderRgba && borderRgba[3] > 0 && node.borderWidth > 0
      ? solidFill(borderRgba[0], borderRgba[1], borderRgba[2], borderRgba[3])
      : null;

  const frameGuid = sb.addFrame({
    parent,
    name: node.tag,
    x: relX,
    y: relY,
    width: node.width,
    height: node.height,
    fill,
    cornerRadii: node.cornerRadii,
    stroke,
    strokeWeight: node.borderWidth,
  });

  for (const child of node.children) {
    if (child.kind === "text") {
      const color = parseColor(child.color) ?? [0, 0, 0, 1];
      const fontFamily = pickAvailableFont(child.fontFamily, child.fontSize);
      const weightStyle =
        WEIGHT_TO_STYLE[String(child.fontWeight)] ?? "Regular";
      const lineHeight = parseLineHeight(child.lineHeight, child.fontSize);
      const letterSpacing = parsePx(child.letterSpacing);
      const align = TEXT_ALIGN_MAP[child.textAlign] ?? "LEFT";

      const textX = child.wrapped ? child.parentX - node.x : child.x - node.x;
      const rawTextY = child.wrapped
        ? child.parentY - node.y
        : child.y - node.y;
      const parentYLocal = child.parentY - node.y;
      const textY = Math.max(rawTextY, parentYLocal);
      const textWidth = child.wrapped ? child.parentWidth : child.width;
      const textHeight = child.height;
      const autoResize = child.wrapped ? "HEIGHT" : "WIDTH_AND_HEIGHT";

      sb.addText({
        parent: frameGuid,
        text: child.text,
        x: textX,
        y: textY,
        width: textWidth,
        height: textHeight,
        fontFamily,
        fontStyle: weightStyle,
        fontSize: child.fontSize,
        lineHeight,
        letterSpacing,
        color,
        alignHorizontal: align,
        autoResize,
      });
    } else if (child.kind === "svg") {
      emitSvg(sb, child, frameGuid, node.x, node.y);
    } else {
      emitElement(sb, child, frameGuid, node.x, node.y);
    }
  }
}

export function buildSceneFromElement(element: HTMLElement): SceneBuilder {
  const layout = extractLayout(element);
  if (!layout || layout.kind !== "element") {
    throw new Error("Element produced no extractable layout");
  }

  let root: ElementInfo = layout;
  const nonTextChildren = root.children.filter((c) => c.kind !== "text");
  const onlyChild = nonTextChildren[0];
  if (nonTextChildren.length === 1 && onlyChild?.kind === "element") {
    root = onlyChild;
  }

  const sb = new SceneBuilder();
  emitElement(sb, root, sb.canvasGuid, root.x, root.y);
  return sb;
}
