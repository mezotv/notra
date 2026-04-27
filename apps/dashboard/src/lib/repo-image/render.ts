import { Resvg } from "@resvg/resvg-js";
import type { ReactNode } from "react";
import satori from "satori";
import { html as parseHtml } from "satori-html";

export const REPO_IMAGE_WIDTH = 1200;
export const REPO_IMAGE_HEIGHT = 630;

const GOOGLE_FONT_URL_REGEX =
  /src: url\((.+?)\) format\('(opentype|truetype)'\)/;

type FontSpec = {
  name: string;
  weight: 400 | 500 | 700;
  family: string;
};

const FONT_SPECS: FontSpec[] = [
  { name: "Inter", weight: 400, family: "Inter" },
  { name: "Inter", weight: 700, family: "Inter:wght@700" },
  { name: "Geist", weight: 400, family: "Geist" },
  { name: "Geist", weight: 700, family: "Geist:wght@700" },
  { name: "Instrument Serif", weight: 400, family: "Instrument Serif" },
  { name: "JetBrains Mono", weight: 500, family: "JetBrains Mono:wght@500" },
];

const fontCache = new Map<string, ArrayBuffer>();

async function loadGoogleFont(familySpec: string): Promise<ArrayBuffer> {
  const cached = fontCache.get(familySpec);
  if (cached) {
    return cached;
  }

  const url = `https://fonts.googleapis.com/css2?family=${familySpec.replace(
    / /g,
    "+"
  )}`;

  const cssResponse = await fetch(url);
  if (!cssResponse.ok) {
    throw new Error(`Failed to fetch Google Font CSS for ${familySpec}`);
  }

  const css = await cssResponse.text();
  const fontUrl = css.match(GOOGLE_FONT_URL_REGEX)?.[1];
  if (!fontUrl) {
    throw new Error(`Failed to resolve font URL for ${familySpec}`);
  }

  const fontResponse = await fetch(fontUrl);
  if (!fontResponse.ok) {
    throw new Error(`Failed to fetch font file for ${familySpec}`);
  }

  const buffer = await fontResponse.arrayBuffer();
  fontCache.set(familySpec, buffer);
  return buffer;
}

async function loadAllFonts() {
  const loaded = await Promise.all(
    FONT_SPECS.map(async (spec) => ({
      name: spec.name,
      weight: spec.weight,
      style: "normal" as const,
      data: await loadGoogleFont(spec.family),
    }))
  );
  return loaded;
}

type VNode = {
  type?: string;
  props?: {
    style?: Record<string, unknown>;
    children?: unknown;
  };
};

const SATORI_VALID_DISPLAY = new Set(["flex", "contents", "none"]);

const STYLE_ATTR_RE = /style\s*=\s*(['"])([\s\S]*?)\1/i;

function injectDisplayFlexInHtml(htmlSource: string): string {
  return htmlSource.replace(/<div\b([^>]*)>/gi, (match, rawAttrs: string) => {
    const styleMatch = rawAttrs.match(STYLE_ATTR_RE);

    if (styleMatch) {
      const quote = styleMatch[1] ?? '"';
      const styleBody = styleMatch[2] ?? "";
      if (/(^|;)\s*display\s*:/i.test(styleBody)) {
        return match;
      }
      const newStyle = `display:flex;${styleBody.replace(/^\s*;?/, "")}`;
      const newAttrs = rawAttrs.replace(
        STYLE_ATTR_RE,
        `style=${quote}${newStyle}${quote}`
      );
      return `<div${newAttrs}>`;
    }

    const trailing = rawAttrs.endsWith("/") ? rawAttrs.slice(0, -1) : rawAttrs;
    return `<div${trailing} style="display:flex">`;
  });
}

function isVNode(value: unknown): value is VNode {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "props" in value
  );
}

function enforceSatoriDisplay(node: unknown) {
  if (!isVNode(node)) {
    return;
  }
  const children = node.props?.children;

  if (Array.isArray(children)) {
    for (const child of children) {
      enforceSatoriDisplay(child);
    }
  } else if (isVNode(children)) {
    enforceSatoriDisplay(children);
  }

  if (node.type !== "div") {
    return;
  }

  const props = (node.props ??= {});
  const style = (props.style ??= {});
  const display = style.display;
  if (typeof display !== "string" || !SATORI_VALID_DISPLAY.has(display)) {
    style.display = "flex";
  }
}

export async function renderHtmlToImages(htmlSource: string) {
  const safeHtml = injectDisplayFlexInHtml(htmlSource);
  const tree = parseHtml(safeHtml) as ReactNode;
  enforceSatoriDisplay(tree);
  const fonts = await loadAllFonts();

  const svg = await satori(tree, {
    width: REPO_IMAGE_WIDTH,
    height: REPO_IMAGE_HEIGHT,
    fonts,
  });

  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: REPO_IMAGE_WIDTH },
  })
    .render()
    .asPng();

  return {
    svg,
    pngBase64: png.toString("base64"),
  };
}
