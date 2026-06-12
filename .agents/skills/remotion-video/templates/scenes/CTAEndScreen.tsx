import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brand } from "../brand";
import { Highlight } from "../highlight";
import { SceneBackground } from "../scene-background";
import type { SceneProps } from "../story-types";

const hexToRgba = (hex: string, alpha: number) => {
  const clean = hex.replace("#", "");
  const n =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const r = Number.parseInt(n.slice(0, 2), 16);
  const g = Number.parseInt(n.slice(2, 4), 16);
  const b = Number.parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const CTAEndScreen: React.FC<SceneProps<"CTAEndScreen">> = ({
  headline,
  actionVerb,
  url,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const headlineEnter = spring({ frame, fps, config: { damping: 14 } });
  const headlineScale = interpolate(headlineEnter, [0, 1], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headlineOpacity = interpolate(headlineEnter, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaEnter = spring({
    frame: Math.max(0, frame - 12),
    fps,
    config: { damping: 14 },
  });
  const ctaScale = interpolate(ctaEnter, [0, 1], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaOpacity = interpolate(ctaEnter, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const urlOpacity = interpolate(frame, [fps * 0.66, fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulse the arrow: 1.0 -> 1.08 -> 1.0 across the scene
  const arrowPulse = interpolate(
    frame,
    [0, durationInFrames / 2, durationInFrames],
    [1, 1.08, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <SceneBackground variant="primary-glow">
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          gap: 40,
          padding: 80,
        }}
      >
        <div
          style={{
            fontFamily: brand.font.family,
            fontSize: 80,
            fontWeight: 800,
            color: brand.colors.text,
            textAlign: "center",
            transform: `scale(${headlineScale})`,
            opacity: headlineOpacity,
            maxWidth: "85%",
            letterSpacing: "-0.01em",
          }}
        >
          <Highlight text={headline} />
        </div>
        <div
          style={{
            fontFamily: brand.font.family,
            fontSize: 160,
            fontWeight: 900,
            color: brand.colors.primary,
            textTransform: "uppercase",
            letterSpacing: "-0.03em",
            transform: `scale(${ctaScale})`,
            opacity: ctaOpacity,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            gap: 32,
            textShadow: `0 0 80px ${hexToRgba(brand.colors.primary, 0.45)}, 0 0 24px ${hexToRgba(brand.colors.primary, 0.3)}`,
          }}
        >
          <span>{actionVerb}</span>
          <span
            style={{
              display: "inline-block",
              transform: `scale(${arrowPulse})`,
            }}
          >
            →
          </span>
        </div>
        {url && (
          <div
            style={{
              fontFamily: "'Fira Code', monospace",
              fontSize: 44,
              color: brand.colors.text,
              opacity: urlOpacity,
              padding: "14px 36px",
              borderRadius: 999,
              background: "rgba(255, 255, 255, 0.06)",
              border: `1px solid ${hexToRgba(brand.colors.primary, 0.5)}`,
              display: "flex",
              alignItems: "center",
              gap: 16,
              boxShadow: `0 0 40px ${hexToRgba(brand.colors.primary, 0.2)}`,
            }}
          >
            <span>🔗</span>
            <span>{url}</span>
          </div>
        )}
      </AbsoluteFill>
    </SceneBackground>
  );
};

export default CTAEndScreen;
