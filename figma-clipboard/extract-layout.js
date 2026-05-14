// Render an HTML file in headless Chromium, walk the DOM, dump a layout tree
// where each node carries its computed bounding box + relevant styling.
//
// Usage:
//   bunx playwright@1.49.0 install chromium  (one-time)
//   node extract-layout.js <input.html> <output.json>

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error("usage: node extract-layout.js <input.html> <output.json>");
  process.exit(1);
}

const absInput = resolve(inputPath);
const url = pathToFileURL(absInput).toString();

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1600, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
await page.goto(url, { waitUntil: "networkidle" });

const tree = await page.evaluate(() => {
  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue.replace(/\s+/g, " ").trim();
      if (!text) return null;
      // Wrap text in a Range to get its rect
      const range = document.createRange();
      range.selectNodeContents(node);
      const rect = range.getBoundingClientRect();
      const parentStyle = getComputedStyle(node.parentElement);
      return {
        kind: "text",
        text,
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        fontFamily: parentStyle.fontFamily,
        fontSize: Number.parseFloat(parentStyle.fontSize),
        fontWeight: parentStyle.fontWeight,
        fontStyle: parentStyle.fontStyle,
        lineHeight: parentStyle.lineHeight,
        letterSpacing: parentStyle.letterSpacing,
        color: parentStyle.color,
        textAlign: parentStyle.textAlign,
      };
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const tag = node.tagName.toLowerCase();
    if (
      tag === "script" ||
      tag === "style" ||
      tag === "meta" ||
      tag === "link" ||
      tag === "head"
    ) {
      return null;
    }
    if (tag === "svg") {
      const rect = node.getBoundingClientRect();
      return {
        kind: "svg",
        tag,
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        innerHTML: node.outerHTML,
      };
    }
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    const style = getComputedStyle(node);

    const children = [];
    for (const child of node.childNodes) {
      const c = walk(child);
      if (c) children.push(c);
    }

    return {
      kind: "element",
      tag,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      background: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      borderRadius: style.borderRadius,
      borderTop: style.borderTop,
      borderRight: style.borderRight,
      borderBottom: style.borderBottom,
      borderLeft: style.borderLeft,
      opacity: style.opacity,
      boxShadow: style.boxShadow,
      display: style.display,
      flexDirection: style.flexDirection,
      alignItems: style.alignItems,
      justifyContent: style.justifyContent,
      gap: style.gap,
      paddingTop: Number.parseFloat(style.paddingTop) || 0,
      paddingRight: Number.parseFloat(style.paddingRight) || 0,
      paddingBottom: Number.parseFloat(style.paddingBottom) || 0,
      paddingLeft: Number.parseFloat(style.paddingLeft) || 0,
      children,
    };
  }

  return walk(document.body);
});

writeFileSync(outputPath, JSON.stringify(tree, null, 2));
console.log(`wrote ${outputPath}`);

await browser.close();
