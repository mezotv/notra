import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { BrushUnderline } from "../components/brush-underline";
import { NotraMarkSvg } from "../components/notra-mark";
import { COPY } from "../lib/copy";
import { interFamily, serifFamily } from "../lib/fonts";
import { steadyTransform } from "../lib/steady";
import { COLORS } from "../lib/theme";

export function EndCard() {
  const frame = useCurrentFrame();

  const logo = interpolate(frame, [0, 14], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const title = interpolate(frame, [6, 24], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const url = interpolate(frame, [16, 32], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const underline = interpolate(frame, [28, 44], [0, 1], {
    easing: Easing.bezier(0.65, 0, 0.35, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.stage,
        alignItems: "center",
        justifyContent: "center",
        gap: 44,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          opacity: logo,
          ...steadyTransform(`translateY(${(1 - logo) * 18}px)`),
        }}
      >
        <NotraMarkSvg size={88} />
        <span
          style={{
            fontFamily: interFamily,
            fontSize: 54,
            fontWeight: 600,
            letterSpacing: -1.5,
            color: COLORS.ink,
          }}
        >
          Notra
        </span>
      </div>
      <span
        style={{
          fontFamily: serifFamily,
          fontSize: 88,
          color: COLORS.ink,
          opacity: title,
          ...steadyTransform(`translateY(${(1 - title) * 22}px)`),
        }}
      >
        {COPY.endTitleLead}{" "}
        <span style={{ position: "relative", display: "inline-block" }}>
          {COPY.endTitleAccent}
          <BrushUnderline progress={underline} />
        </span>
      </span>
      <span
        style={{
          fontFamily: interFamily,
          fontSize: 26,
          fontWeight: 500,
          color: COLORS.mutedForeground,
          opacity: url,
          ...steadyTransform(`translateY(${(1 - url) * 16}px)`),
        }}
      >
        {COPY.endUrl}
      </span>
    </AbsoluteFill>
  );
}
