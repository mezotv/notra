export type CursorVariant =
  | "default"
  | "handpointing"
  | "handgrabbing"
  | "textcursor";

export interface CursorKeyframe {
  frame: number;
  x: number;
  y: number;
}

export interface CursorVariantKeyframe {
  frame: number;
  variant: CursorVariant;
}

export interface ConfettiBurstProps {
  originX: number;
  originY: number;
  startFrame: number;
  count?: number;
  spreadX?: number;
  spreadY?: number;
}
