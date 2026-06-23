import type { Font, Glyph } from "opentype.js";

export interface LayoutOptions {
  text: string;
  font: Font;
  fontFamily: string;
  fontStyle: string;
  fontWeight: number;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  maxWidth: number;
  wrap: boolean;
  alignHorizontal?: string;
}

export interface CharacterGlyph {
  char: string;
  firstCharacter: number;
  glyph: Glyph;
  advance: number;
  width: number;
}

export interface LineLayout {
  chars: CharacterGlyph[];
  width: number;
  firstCharacter: number;
  endCharacter: number;
}

export interface VariableFont extends Font {
  variation?: {
    getTransform: (glyph: Glyph, coords: Record<string, number>) => Glyph;
  };
}
