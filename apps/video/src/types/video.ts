import type { ReactNode } from "react";

export type DashboardShotState = "image" | "generating" | "menu";

export interface GalleryCardProps {
  headlinePre: string;
  headlineAccent?: string;
  headlinePost?: string;
  sub?: string;
  layout?: "centered" | "split";
  mediaSide?: "left" | "right";
  visual?: ReactNode;
  footer?: ReactNode;
}

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

export type ZoomDissolveProps = Record<string, never>;

export interface PunchZoomOptions {
  inStart: number;
  inEnd: number;
  outStart: number;
  outEnd: number;
  scale: number;
}

export type TextSlideEntrance = "rise" | "fold";

export interface TextSlideProps {
  title: string;
  sub?: string;
  accent?: string;
  entrance?: TextSlideEntrance;
  foldTo?: string;
  foldToAccent?: string;
  foldToUnderline?: string;
  foldAt?: number;
}

export interface BrushUnderlineProps {
  progress: number;
}

export interface ConfettiBurstProps {
  originX: number;
  originY: number;
  startFrame: number;
  count?: number;
  spreadX?: number;
  spreadY?: number;
}
