import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { AbsoluteFill, interpolate } from "remotion";
import { steadyTransform } from "../lib/steady";
import { COLORS } from "../lib/theme";
import type { ZoomDissolveProps } from "../types/video";

function ZoomDissolvePresentation({
  children,
  presentationDirection,
  presentationProgress,
}: TransitionPresentationComponentProps<ZoomDissolveProps>) {
  const entering = presentationDirection === "entering";

  const scale = entering
    ? interpolate(presentationProgress, [0, 1], [0.93, 1])
    : interpolate(presentationProgress, [0, 1], [1, 1.16]);

  const opacity = entering
    ? interpolate(presentationProgress, [0, 0.4], [0, 1], {
        extrapolateRight: "clamp",
      })
    : 1;

  const blur = entering
    ? interpolate(presentationProgress, [0, 0.55, 1], [9, 2, 0])
    : interpolate(presentationProgress, [0, 1], [0, 10]);

  const glow = entering
    ? interpolate(presentationProgress, [0, 0.4, 0.9], [0, 0.55, 0], {
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <AbsoluteFill
      style={{
        opacity,
        ...steadyTransform(`scale(${scale})`),
        filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
      }}
    >
      {children}
      {glow > 0 ? (
        <AbsoluteFill
          style={{
            opacity: glow,
            background: `radial-gradient(ellipse 75% 65% at 50% 48%, #ffffff 0%, ${COLORS.lavender}33 45%, #ffffff00 72%)`,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
}

export function zoomDissolve(): TransitionPresentation<ZoomDissolveProps> {
  return { component: ZoomDissolvePresentation, props: {} };
}
