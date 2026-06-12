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

export const HookTitle: React.FC<SceneProps<"HookTitle">> = ({
  text,
  visual,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 120, mass: 0.6 },
  });
  const scale = interpolate(enter, [0, 1], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(enter, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const baseColor =
    visual === "pattern-interrupt"
      ? brand.colors.accent
      : visual === "curiosity-gap"
        ? brand.colors.text
        : brand.colors.text;

  return (
    <SceneBackground variant="primary-glow">
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: brand.font.family,
            fontWeight: 900,
            fontSize: 140,
            textAlign: "center",
            color: baseColor,
            transform: `scale(${scale})`,
            opacity,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            maxWidth: "85%",
            position: "relative",
          }}
        >
          <Highlight text={text} />
        </div>
      </AbsoluteFill>
    </SceneBackground>
  );
};

export default HookTitle;
