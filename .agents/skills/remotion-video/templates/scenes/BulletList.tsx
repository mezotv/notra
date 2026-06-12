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
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const BulletList: React.FC<SceneProps<"BulletList">> = ({
  items,
  caption,
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (items.length === 0) {
    throw new Error(
      "BulletList: items array is empty. The scene needs at least one item to render."
    );
  }

  const captionOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const stagger = Math.floor(durationFrames / (items.length + 2));

  return (
    <SceneBackground variant="diagonal">
      <AbsoluteFill
        style={{
          padding: 100,
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
              marginBottom: 60,
              opacity: captionOpacity,
              textAlign: "center",
            }}
          >
            <Highlight text={caption} />
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          {items.map((item, i) => {
            const appearAt = (i + 1) * stagger;
            const local = Math.max(0, frame - appearAt);
            const enter = spring({
              frame: local,
              fps,
              config: { damping: 14, stiffness: 120 },
            });
            const x = interpolate(enter, [0, 1], [-50, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const opacity = interpolate(enter, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={i}
                style={{
                  fontFamily: brand.font.family,
                  fontSize: 64,
                  fontWeight: 800,
                  color: brand.colors.text,
                  transform: `translateX(${x}px)`,
                  opacity,
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 56,
                    height: 56,
                    minWidth: 56,
                    borderRadius: 999,
                    background: brand.colors.primary,
                    color: brand.colors.text,
                    fontSize: 48,
                    fontWeight: 900,
                    lineHeight: 1,
                    boxShadow: `0 0 24px ${hexToRgba(brand.colors.primary, 0.5)}`,
                  }}
                >
                  •
                </span>
                <Highlight text={item} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </SceneBackground>
  );
};

export default BulletList;
