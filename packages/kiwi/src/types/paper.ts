export interface BuildPaperPasteHtmlOptions {
  fileId?: string;
  label?: string;
  name?: string;
  pasteId?: string;
  unwrapSingleChild?: boolean;
}

export interface BorderSide {
  color: string;
  width: number;
}

export interface BoxBorders {
  bottom: BorderSide;
  left: BorderSide;
  right: BorderSide;
  top: BorderSide;
}

export interface OklchColor {
  alpha?: number;
  c: number;
  h: number;
  l: number;
  mode: "oklch";
}

export interface PaperColor {
  mode: "hex";
  value: OklchColor;
}

export interface PaperPaint {
  color: PaperColor;
  isVisible: boolean;
  type: "solid";
}

export interface PaperBorder {
  color: PaperColor;
  isVisible: boolean;
  style: string;
  type: "color";
  width: string;
}

export interface PaperEmbedData {
  fileId: string;
  id: string;
  images: Record<string, never>;
  nodes: Record<string, PaperNode>;
  oldIdToNewIdMap: Record<string, string>;
  parentToChildrenIndex: Record<string, string[]>;
  positions: Record<string, [number, number]>;
  topLevelNodeIds: string[];
}

export interface PaperFont {
  axes?: Record<string, { max: number; min: number; tag: string }>;
  coordinates?: Record<string, number>;
  family: string;
  isItalic: boolean;
  style: string;
  weight: number;
}

export interface PaperNode {
  "~": false;
  component: "Frame" | "Rectangle" | "SVG" | "SVGVisualElement" | "Text";
  id: string;
  label: string;
  labelIsModified?: true;
  props?: Record<string, unknown>;
  styleMeta?: {
    borders?: {
      all: PaperBorder;
    };
    fill?: PaperPaint[];
    font?: PaperFont;
  };
  styles: Record<string, string | number>;
  tag?: string;
  textValue?: string;
}
