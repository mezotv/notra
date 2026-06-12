import { Easing, interpolate } from "remotion";
import type { PunchZoomOptions } from "../types/video";

const PUNCH_IN = Easing.bezier(0.16, 1, 0.3, 1);
const PUNCH_OUT = Easing.bezier(0.65, 0, 0.35, 1);

export function punchZoom(
  frame: number,
  { inStart, inEnd, outStart, outEnd, scale }: PunchZoomOptions
): number {
  const zoomIn = interpolate(frame, [inStart, inEnd], [0, 1], {
    easing: PUNCH_IN,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const zoomOut = interpolate(frame, [outStart, outEnd], [1, 0], {
    easing: PUNCH_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return 1 + (scale - 1) * zoomIn * zoomOut;
}
