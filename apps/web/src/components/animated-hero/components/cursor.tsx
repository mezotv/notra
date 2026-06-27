import { steadyTransform } from "../lib/steady";
import {
  Easing,
  Img,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
} from "../remotion";
import type {
  CursorKeyframe,
  CursorVariant,
  CursorVariantKeyframe,
} from "../types/video";

interface CursorProps {
  keyframes: CursorKeyframe[];
  clickFrames?: number[];
  variant?: CursorVariant;
  variantKeyframes?: CursorVariantKeyframe[];
  size?: number;
  opacity?: number;
}

const HOTSPOTS: Record<CursorVariant, { x: number; y: number }> = {
  default: { x: 10 / 32, y: 7 / 32 },
  handpointing: { x: 13 / 32, y: 5 / 32 },
  handgrabbing: { x: 14 / 32, y: 10 / 32 },
  textcursor: { x: 16 / 32, y: 16 / 32 },
};

const MOVE_EASING = Easing.bezier(0.4, 0, 0.2, 1);
const CLICK_DURATION = 8;
const BOW_RATIO = 0.14;
const BOW_MAX = 70;

function positionAt(keyframes: CursorKeyframe[], frame: number) {
  const first = keyframes[0];
  const last = keyframes.at(-1) ?? first;
  if (!(first && last)) {
    return { x: 0, y: 0 };
  }
  if (frame <= first.frame) {
    return { x: first.x, y: first.y };
  }
  if (frame >= last.frame) {
    return { x: last.x, y: last.y };
  }
  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i];
    const b = keyframes[i + 1];
    if (!(a && b)) {
      continue;
    }
    if (frame >= a.frame && frame <= b.frame) {
      const span = b.frame - a.frame;
      const progress = interpolate(frame, [a.frame, b.frame], [0, 1], {
        easing: span >= 10 ? MOVE_EASING : Easing.linear,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 1) {
        return { x: a.x, y: a.y };
      }
      const direction = random(`cursor-bow-${i}`) > 0.5 ? 1 : -1;
      const bow = Math.min(distance * BOW_RATIO, BOW_MAX) * direction;
      const arc = Math.sin(progress * Math.PI) * bow;
      return {
        x: a.x + dx * progress + (-dy / distance) * arc,
        y: a.y + dy * progress + (dx / distance) * arc,
      };
    }
  }
  return { x: last.x, y: last.y };
}

function clickScaleAt(clickFrames: number[], frame: number) {
  let scale = 1;
  for (const clickFrame of clickFrames) {
    const local = frame - clickFrame;
    if (local >= 0 && local <= CLICK_DURATION) {
      const dip = interpolate(
        local,
        [0, CLICK_DURATION / 2, CLICK_DURATION],
        [0, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
      scale = 1 - 0.18 * dip;
    }
  }
  return scale;
}

function variantAt(
  variantKeyframes: CursorVariantKeyframe[],
  frame: number,
  fallback: CursorVariant
) {
  let current = fallback;
  for (const keyframe of variantKeyframes) {
    if (frame >= keyframe.frame) {
      current = keyframe.variant;
    }
  }
  return current;
}

export function Cursor({
  keyframes,
  clickFrames = [],
  variant = "default",
  variantKeyframes = [],
  size = 44,
  opacity = 1,
}: CursorProps) {
  const frame = useCurrentFrame();
  const { x, y } = positionAt(keyframes, frame);
  const scale = clickScaleAt(clickFrames, frame);
  const activeVariant = variantAt(variantKeyframes, frame, variant);
  const hotspot = HOTSPOTS[activeVariant];

  return (
    <Img
      src={staticFile(`cursors/${activeVariant}.svg`)}
      style={{
        position: "absolute",
        left: x - size * hotspot.x,
        top: y - size * hotspot.y,
        width: size,
        height: size,
        opacity,
        ...steadyTransform(`scale(${scale})`),
        transformOrigin: `${hotspot.x * 100}% ${hotspot.y * 100}%`,
        filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.25))",
        zIndex: 50,
      }}
    />
  );
}
