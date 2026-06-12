import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { brand } from "../brand";
import { Highlight } from "../highlight";
import { SceneBackground } from "../scene-background";
import type { SceneProps } from "../story-types";

export const ProblemSetup: React.FC<SceneProps<"ProblemSetup">> = ({
  text,
  visualBeats,
  durationFrames,
}) => {
  const frame = useCurrentFrame();

  if (visualBeats.length === 0) {
    throw new Error(
      "ProblemSetup: visualBeats array is empty. The scene needs at least one beat to render."
    );
  }

  const headerOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const beatInterval = Math.floor(durationFrames / (visualBeats.length + 1));

  return (
    <SceneBackground variant="vignette">
      <AbsoluteFill
        style={{
          padding: 80,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: brand.font.family,
            fontSize: 72,
            fontWeight: 800,
            color: brand.colors.text,
            opacity: headerOpacity,
            marginBottom: 60,
            lineHeight: 1.1,
            textAlign: "left",
          }}
        >
          <Highlight text={text} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {visualBeats.map((beat, i) => {
            const appearAt = (i + 1) * beatInterval;
            const beatOpacity = interpolate(
              frame,
              [appearAt, appearAt + 8],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const beatX = interpolate(
              frame,
              [appearAt, appearAt + 12],
              [-40, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            return (
              <div
                key={i}
                style={{
                  fontFamily: brand.font.family,
                  fontSize: 44,
                  color: brand.colors.text,
                  opacity: beatOpacity,
                  transform: `translateX(${beatX}px)`,
                  padding: "24px 32px",
                  background: "rgba(255, 255, 255, 0.04)",
                  borderLeft: `6px solid ${brand.colors.danger}`,
                  borderRadius: 14,
                  textAlign: "left",
                }}
              >
                <Highlight text={beat} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </SceneBackground>
  );
};

export default ProblemSetup;
