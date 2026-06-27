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
