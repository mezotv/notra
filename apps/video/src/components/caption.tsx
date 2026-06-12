import { Easing, interpolate, useCurrentFrame } from "remotion";
import { interFamily } from "../lib/fonts";
import { steadyTransform } from "../lib/steady";
import { COLORS } from "../lib/theme";

interface CaptionProps {
  text: string;
  enterAt: number;
  exitAt?: number;
  bottom?: number;
}

const ENTER_DURATION = 14;
const EXIT_DURATION = 10;

export function Caption({ text, enterAt, exitAt, bottom = 64 }: CaptionProps) {
  const frame = useCurrentFrame();

  const enter = interpolate(
    frame,
    [enterAt, enterAt + ENTER_DURATION],
    [0, 1],
    {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const exit =
    exitAt === undefined
      ? 0
      : interpolate(frame, [exitAt, exitAt + EXIT_DURATION], [0, 1], {
          easing: Easing.in(Easing.cubic),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  const progress = enter - exit;

  return (
    <div
      style={{
        position: "absolute",
        bottom,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: progress,
        ...steadyTransform(`translateY(${(1 - progress) * 16}px)`),
      }}
    >
      <span
        style={{
          padding: "12px 26px",
          borderRadius: 999,
          background: "rgba(30,30,30,0.85)",
          color: "#f6f3f1",
          fontFamily: interFamily,
          fontSize: 26,
          fontWeight: 500,
          letterSpacing: -0.2,
        }}
      >
        {text}
      </span>
    </div>
  );
}
