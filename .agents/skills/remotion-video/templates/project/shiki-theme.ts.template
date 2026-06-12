import { brand } from "./brand";

/**
 * Shiki theme derived from the brand palette so code blocks match the
 * surrounding presentation. Regenerating by pulling color tokens at
 * module-load time means a brand swap (scene-wide primary/accent/text
 * change) automatically propagates to code too — no second theme file to
 * keep in sync.
 *
 * Token-color bias:
 * - Keywords / control flow / storage → brand.primary (signature color)
 * - Strings / numerics → brand.accent (the warmer counterweight)
 * - Functions → brand.text (high contrast, anchors the eye)
 * - Comments → brand.muted, italic (low visual weight, still legible)
 * - Types → a softened primary derived from brand.primary
 * - Punctuation → brand.muted (recedes)
 *
 * The background is explicitly transparent so the surrounding card's
 * translucent fill and brand-primary-tinted shadow stay visible.
 */

const softenHexToward = (hex: string, target: string, ratio: number): string => {
  const parse = (h: string) => {
    const c = h.replace("#", "");
    const n = c.length === 3 ? c.split("").map((ch) => ch + ch).join("") : c;
    return [
      parseInt(n.slice(0, 2), 16),
      parseInt(n.slice(2, 4), 16),
      parseInt(n.slice(4, 6), 16),
    ] as const;
  };
  const [r1, g1, b1] = parse(hex);
  const [r2, g2, b2] = parse(target);
  const mix = (a: number, b: number) => Math.round(a * (1 - ratio) + b * ratio);
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(mix(r1, r2))}${toHex(mix(g1, g2))}${toHex(mix(b1, b2))}`;
};

const keywordColor = brand.colors.primary;
const stringColor = brand.colors.accent;
const numberColor = brand.colors.accent;
const functionColor = brand.colors.text;
const commentColor = brand.colors.muted;
const typeColor = softenHexToward(brand.colors.primary, "#FFFFFF", 0.35);
const punctuationColor = brand.colors.muted;
const defaultText = softenHexToward(brand.colors.text, "#000000", 0.08);

export const brandShikiTheme = {
  name: "brand-theme",
  type: "dark",
  colors: {
    "editor.foreground": defaultText,
    "editor.background": "#00000000",
  },
  tokenColors: [
    {
      scope: ["comment", "punctuation.definition.comment", "string.comment"],
      settings: { foreground: commentColor, fontStyle: "italic" },
    },
    {
      scope: [
        "keyword",
        "keyword.control",
        "keyword.operator.new",
        "keyword.operator.expression",
        "storage",
        "storage.type",
        "storage.modifier",
        "variable.language",
        "keyword.control.import",
        "keyword.control.from",
        "keyword.control.export",
      ],
      settings: { foreground: keywordColor, fontStyle: "italic" },
    },
    {
      scope: ["keyword.operator", "punctuation.accessor"],
      settings: { foreground: softenHexToward(defaultText, "#000000", 0.15) },
    },
    {
      scope: ["string", "string.quoted", "string.template"],
      settings: { foreground: stringColor },
    },
    {
      scope: [
        "constant.numeric",
        "constant.language",
        "constant.language.boolean",
        "constant.language.null",
        "constant.language.undefined",
      ],
      settings: { foreground: numberColor },
    },
    {
      scope: [
        "entity.name.function",
        "support.function",
        "meta.function-call entity.name.function",
        "variable.function",
      ],
      settings: { foreground: functionColor },
    },
    {
      scope: [
        "variable",
        "variable.other",
        "variable.other.readwrite",
        "variable.other.object",
        "variable.parameter",
        "meta.object-literal.key",
        "support.variable.property",
        "variable.other.property",
        "meta.property.object",
      ],
      settings: { foreground: defaultText },
    },
    {
      scope: [
        "entity.name.type",
        "entity.name.class",
        "entity.name.namespace",
        "support.type",
        "support.class",
        "meta.type",
      ],
      settings: { foreground: typeColor },
    },
    {
      scope: [
        "punctuation",
        "meta.brace",
        "meta.delimiter",
        "punctuation.separator",
        "punctuation.terminator",
      ],
      settings: { foreground: punctuationColor },
    },
    {
      scope: ["entity.name.tag", "entity.other.attribute-name"],
      settings: { foreground: keywordColor },
    },
  ],
} as const;
