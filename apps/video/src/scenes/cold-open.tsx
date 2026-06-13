import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { NotraMarkSvg } from "../components/notra-mark";
import { COPY } from "../lib/copy";
import { interFamily, serifFamily } from "../lib/fonts";
import { steadyTransform } from "../lib/steady";
import { COLORS } from "../lib/theme";

export function ColdOpen() {
  const frame = useCurrentFrame();

  const draw = interpolate(frame, [0, 30], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pop = interpolate(frame, [0, 16], [0, 1], {
    easing: Easing.bezier(0.34, 1.4, 0.64, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const wordmark = interpolate(frame, [12, 26], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tagline = interpolate(frame, [32, 50], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.stage,
        alignItems: "center",
        justifyContent: "center",
        gap: 48,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
          ...steadyTransform(`scale(${0.85 + 0.15 * pop})`),
        }}
      >
        <NotraMarkSvg drawProgress={draw} size={150} />
        <span
          style={{
            fontFamily: interFamily,
            fontSize: 88,
            fontWeight: 600,
            letterSpacing: -2,
            color: COLORS.ink,
            opacity: wordmark,
            ...steadyTransform(`translateX(${(1 - wordmark) * -14}px)`),
          }}
        >
          Notra
        </span>
      </div>
      <span
        style={{
          fontFamily: serifFamily,
          fontSize: 64,
          color: COLORS.ink,
          opacity: tagline,
          marginRight: "0.27em",
          ...steadyTransform(`translateY(${(1 - tagline) * 22}px)`),
        }}
      >
        {COPY.coldOpen}
      </span>
    </AbsoluteFill>
  );
}
