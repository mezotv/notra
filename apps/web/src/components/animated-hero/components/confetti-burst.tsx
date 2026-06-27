import { steadyTransform } from "../lib/steady";
import { interpolate, random, useCurrentFrame } from "../remotion";
import type { ConfettiBurstProps } from "../types/video";

const PALETTE = [
  "#ff5d5d",
  "#ff9f1c",
  "#ffd166",
  "#06d6a0",
  "#118ab2",
  "#5d5dff",
  "#c45dff",
  "#ff5da2",
] as const;

const LIFETIME = 50;
const GRAVITY = 0.55;
const DRAG = 0.965;

export function ConfettiBurst({
  originX,
  originY,
  startFrame,
  count = 42,
  spreadX = 0,
  spreadY = 0,
}: ConfettiBurstProps) {
  const frame = useCurrentFrame();
  const t = frame - startFrame;

  if (t < 0 || t > LIFETIME) {
    return null;
  }

  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const seed = `confetti-${index}`;
        const angle = random(`${seed}-a`) * Math.PI * 2;
        const speed = 8 + random(`${seed}-s`) * 12;
        const lift = 4 + random(`${seed}-l`) * 7;
        const decay = (1 - DRAG ** t) / (1 - DRAG);

        const startX = originX + Math.cos(angle) * spreadX * 0.92;
        const startY = originY + Math.sin(angle) * spreadY * 0.92;

        const x = startX + Math.cos(angle) * speed * decay;
        const y =
          startY +
          (Math.sin(angle) * speed - lift) * decay +
          0.5 * GRAVITY * t * t;

        const size = 16 + random(`${seed}-z`) * 14;
        const spin = (random(`${seed}-r`) - 0.5) * 40 * t;
        const tumble = 0.35 + 0.65 * Math.abs(Math.sin(t / 4 + index));
        const color = PALETTE[index % PALETTE.length];

        const opacity = interpolate(
          t,
          [0, 4, LIFETIME - 16, LIFETIME],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <div
            key={seed}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size * 0.62,
              borderRadius: 2,
              background: color,
              opacity,
              ...steadyTransform(`rotate(${spin}deg) scaleY(${tumble})`),
            }}
          />
        );
      })}
    </>
  );
}
