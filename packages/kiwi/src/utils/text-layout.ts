import type { Font, Glyph } from "opentype.js";
import type { SceneBuilder } from "../builders/scene-builder";
import type { DerivedTextData, TextGlyph } from "../types/scene";
import type {
  CharacterGlyph,
  LayoutOptions,
  LineLayout,
  VariableFont,
} from "../types/text-layout";
import { encodeGlyphCommands } from "./text-glyph";

export type { LayoutOptions } from "../types/text-layout";

const WHITESPACE_RE = /\s/;

export class TextLayoutCache {
  private readonly glyphBlobs = new Map<string, number>();
  private readonly sceneBuilder: SceneBuilder;

  constructor(sceneBuilder: SceneBuilder) {
    this.sceneBuilder = sceneBuilder;
  }

  layout(options: LayoutOptions): DerivedTextData | null {
    const coords = variationCoords(options);
    const chars = shapeCharacters(options);
    if (chars.length === 0) {
      return null;
    }

    const lineHeight =
      options.lineHeight > 0 ? options.lineHeight : options.fontSize * 1.2;
    const lines = breakLines(chars, options.maxWidth, options.wrap);
    const lineAscent = options.fontSize * 0.8;
    const leading = Math.max(0, lineHeight - options.fontSize);
    const baselineOffset = lineAscent + leading / 2;
    const glyphs: TextGlyph[] = [];
    const baselines: DerivedTextData["baselines"] = [];
    const logicalIndexToCharacterOffsetMap: number[] = [];

    lines.forEach((line, lineIndex) => {
      const lineY = lineIndex * lineHeight;
      const baselineY = lineY + baselineOffset;
      let x = lineOffset(options.alignHorizontal, options.maxWidth, line.width);

      baselines.push({
        position: { x, y: baselineY },
        width: line.width,
        lineY,
        lineHeight,
        lineAscent,
        firstCharacter: line.firstCharacter,
        endCharacter: line.endCharacter,
      });

      for (const item of line.chars) {
        const commandsBlob = this.getGlyphBlob(
          options.font,
          item.glyph,
          coords
        );
        logicalIndexToCharacterOffsetMap.push(x);
        glyphs.push({
          commandsBlob,
          position: { x, y: baselineY },
          fontSize: options.fontSize,
          firstCharacter: item.firstCharacter,
          advance: item.advance,
          rotation: 0,
        });
        x += item.width;
      }
    });

    return {
      layoutSize: {
        x: layoutWidth(options.alignHorizontal, options.maxWidth, lines),
        y: lines.length * lineHeight,
      },
      baselines,
      glyphs,
      fontMetaData: [
        {
          key: {
            family: options.fontFamily,
            style: options.fontStyle,
            postscript: "",
          },
          fontLineHeight: lineHeight / options.fontSize,
          fontStyle: "NORMAL",
          fontWeight: options.fontWeight,
        },
      ],
      truncationStartIndex: -1,
      truncatedHeight: -1,
      logicalIndexToCharacterOffsetMap,
    };
  }

  private getGlyphBlob(
    font: Font,
    glyph: Glyph,
    coords: Record<string, number>
  ): number {
    const key = `${font.names.fullName?.en ?? "font"}:${coords.opsz}:${coords.wght}:${glyph.index}`;
    const cached = this.glyphBlobs.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const blobIndex = this.sceneBuilder.addBlob(
      encodeGlyphCommands(glyph, font.unitsPerEm)
    );
    this.glyphBlobs.set(key, blobIndex);
    return blobIndex;
  }
}

function lineOffset(
  alignHorizontal: string | undefined,
  maxWidth: number,
  lineWidth: number
): number {
  if (maxWidth <= lineWidth) {
    return 0;
  }
  if (alignHorizontal === "CENTER") {
    return (maxWidth - lineWidth) / 2;
  }
  if (alignHorizontal === "RIGHT") {
    return maxWidth - lineWidth;
  }
  return 0;
}

function layoutWidth(
  alignHorizontal: string | undefined,
  maxWidth: number,
  lines: LineLayout[]
): number {
  const contentWidth = Math.max(...lines.map((line) => line.width));
  return alignHorizontal === "CENTER" || alignHorizontal === "RIGHT"
    ? Math.max(maxWidth, contentWidth)
    : contentWidth;
}

function shapeCharacters(options: LayoutOptions): CharacterGlyph[] {
  const out: CharacterGlyph[] = [];
  let index = 0;
  const variation = getVariation(options.font);
  const coords = variationCoords(options);
  for (const char of Array.from(options.text)) {
    const baseGlyph = options.font.charToGlyph(char);
    const glyph = variation?.getTransform(baseGlyph, coords) ?? baseGlyph;
    const advance =
      (glyph.advanceWidth ?? options.font.unitsPerEm) / options.font.unitsPerEm;
    out.push({
      char,
      firstCharacter: index,
      glyph,
      advance,
      width: advance * options.fontSize + options.letterSpacing,
    });
    index += char.length;
  }
  return out;
}

function getVariation(font: Font): VariableFont["variation"] {
  if (hasVariation(font)) {
    return font.variation;
  }
  return undefined;
}

function hasVariation(font: Font): font is VariableFont {
  return "variation" in font;
}

function variationCoords(options: LayoutOptions): Record<string, number> {
  return {
    opsz: clamp(options.fontSize, 14, 32),
    wght: clamp(options.fontWeight, 100, 900),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function breakLines(
  chars: CharacterGlyph[],
  maxWidth: number,
  wrap: boolean
): LineLayout[] {
  if (!wrap || maxWidth <= 0) {
    return [makeLine(chars)];
  }

  const lines: LineLayout[] = [];
  let start = 0;
  let width = 0;
  let lastBreak = -1;

  for (let i = 0; i < chars.length; i += 1) {
    const item = chars[i];
    if (!item) {
      continue;
    }
    if (WHITESPACE_RE.test(item.char)) {
      lastBreak = i;
    }

    if (width > 0 && width + item.width > maxWidth) {
      const breakAt = lastBreak >= start ? lastBreak + 1 : i;
      lines.push(makeLine(trimTrailingWhitespace(chars.slice(start, breakAt))));
      start = skipLeadingWhitespace(chars, breakAt);
      i = start - 1;
      width = 0;
      lastBreak = -1;
      continue;
    }

    width += item.width;
  }

  if (start < chars.length) {
    lines.push(makeLine(trimTrailingWhitespace(chars.slice(start))));
  }
  return lines.length > 0 ? lines : [makeLine(chars)];
}

function skipLeadingWhitespace(chars: CharacterGlyph[], start: number): number {
  let index = start;
  while (index < chars.length && WHITESPACE_RE.test(chars[index]?.char ?? "")) {
    index += 1;
  }
  return index;
}

function trimTrailingWhitespace(chars: CharacterGlyph[]): CharacterGlyph[] {
  let end = chars.length;
  while (end > 0 && WHITESPACE_RE.test(chars[end - 1]?.char ?? "")) {
    end -= 1;
  }
  return chars.slice(0, end);
}

function makeLine(chars: CharacterGlyph[]): LineLayout {
  const first = chars[0];
  const last = chars.at(-1);
  return {
    chars,
    width: chars.reduce((sum, item) => sum + item.width, 0),
    firstCharacter: first?.firstCharacter ?? 0,
    endCharacter: last ? last.firstCharacter + last.char.length : 0,
  };
}
