import type { PathSubpath } from "./svg-path";

export interface BuildSceneFromElementOptions {
  name?: string;
}

export interface BorderSide {
  color: string;
  width: number;
}

export interface BoxBorders {
  top: BorderSide;
  right: BorderSide;
  bottom: BorderSide;
  left: BorderSide;
}

export interface ElementInfo {
  kind: "element";
  name: string;
  tag: string;
  x: number;
  y: number;
  width: number;
  height: number;
  background: string;
  cornerRadii: [number, number, number, number];
  borders: BoxBorders;
  children: LayoutNode[];
}

export interface TextInfo {
  kind: "text";
  name: string;
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

export interface SvgShape {
  subpaths: PathSubpath[];
  fill: string | null;
  fillRule: "nonzero" | "evenodd";
  stroke: string | null;
  strokeLineCap: string;
  strokeLineJoin: string;
  strokeWidth: number;
}

export interface SvgInfo {
  kind: "svg";
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  shapes: SvgShape[];
}

export type LayoutNode = ElementInfo | TextInfo | SvgInfo;
