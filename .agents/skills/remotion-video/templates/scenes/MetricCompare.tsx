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
import type { Metric, SceneProps } from "../story-types";

const Card: React.FC<{
  metric: Metric;
  accent: string;
  delayFrames: number;
}> = ({ metric, accent, delayFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - delayFrames);
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 110 },
  });
  const scale = interpolate(enter, [0, 1], [0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(enter, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        flex: 1,
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 24,
        padding: 56,
        transform: `scale(${scale})`,
        opacity,
        borderBottom: `8px solid ${accent}`,
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          fontFamily: brand.font.family,
          fontSize: 36,
          fontWeight: 800,
          color: "#7d8590",
          marginBottom: 16,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {metric.label}
      </div>
      <div
        style={{
          fontFamily: brand.font.family,
          fontSize: 180,
          fontWeight: 900,
          color: accent,
          lineHeight: 1,
          letterSpacing: "-0.03em",
        }}
      >
        {metric.value}
      </div>
    </div>
  );
};

export const MetricCompare: React.FC<SceneProps<"MetricCompare">> = ({
  before,
  after,
  caption,
}) => {
  const frame = useCurrentFrame();
  const captionOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneBackground variant="primary-glow">
      <AbsoluteFill
        style={{
          padding: 80,
          justifyContent: "center",
        }}
      >
        {caption && (
          <div
            style={{
              fontFamily: brand.font.family,
              fontSize: 56,
              fontWeight: 800,
              color: brand.colors.text,
              marginBottom: 40,
              textAlign: "center",
              opacity: captionOpacity,
            }}
          >
            <Highlight text={caption} />
          </div>
        )}
        <div style={{ display: "flex", gap: 40 }}>
          <Card accent={brand.colors.accent} delayFrames={0} metric={before} />
          <Card accent={brand.colors.primary} delayFrames={18} metric={after} />
        </div>
      </AbsoluteFill>
    </SceneBackground>
  );
};

export default MetricCompare;
