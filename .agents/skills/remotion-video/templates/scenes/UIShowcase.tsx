import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Video,
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

const isVideoSrc = (src: string) => /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(src);

/**
 * UIShowcase — renders the product's user-visible surface (screenshot,
 * short video clip, or mock component) with optional call-out overlays.
 *
 * The `mockComponent` path is resolved by the scene registry caller: when
 * the story references a mock component, the caller is responsible for
 * passing the resolved React element. This template accepts neither
 * dynamic imports nor a component registry lookup inside the scene — the
 * dispatch happens in `Main.tsx` (see the skill scaffold rules).
 */
export const UIShowcase: React.FC<
  SceneProps<"UIShowcase"> & { mockComponentNode?: React.ReactNode }
> = ({
  caption,
  mediaSrc,
  calloutBoxes,
  mockComponentNode,
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const captionEnter = spring({ frame, fps, config: { damping: 14 } });
  const captionOpacity = interpolate(captionEnter, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const captionY = interpolate(captionEnter, [0, 1], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const frameEnter = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 16, stiffness: 110 },
  });
  const frameOpacity = interpolate(frameEnter, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const frameScale = interpolate(frameEnter, [0, 1], [0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const renderMedia = () => {
    if (mockComponentNode) return mockComponentNode;
    if (!mediaSrc) return null;
    const src = mediaSrc.startsWith("http") ? mediaSrc : staticFile(mediaSrc);
    if (isVideoSrc(mediaSrc)) {
      return (
        <Video
          muted
          src={src}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      );
    }
    return (
      <Img
        src={src}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  };

  return (
    <SceneBackground variant="diagonal">
      <AbsoluteFill
        style={{
          padding: 80,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 56,
        }}
      >
        {caption && (
          <div
            style={{
              fontFamily: brand.font.family,
              fontSize: 48,
              fontWeight: 800,
              color: brand.colors.text,
              textAlign: "center",
              opacity: captionOpacity,
              transform: `translateY(${captionY}px)`,
            }}
          >
            <Highlight text={caption} />
          </div>
        )}

        <div
          style={{
            position: "relative",
            width: "min(72%, 1200px)",
            aspectRatio: "16 / 10",
            opacity: frameOpacity,
            transform: `scale(${frameScale})`,
            borderRadius: 20,
            overflow: "hidden",
            border: `1px solid ${hexToRgba(brand.colors.primary, 0.3)}`,
            boxShadow: `0 0 0 1px ${hexToRgba(brand.colors.primary, 0.18)}, 0 32px 80px ${hexToRgba(brand.colors.primary, 0.22)}`,
            background: "rgba(255, 255, 255, 0.02)",
          }}
        >
          {renderMedia()}

          {calloutBoxes?.map((box, i) => {
            const boxEnter = spring({
              frame: frame - box.appearAt,
              fps,
              config: { damping: 12, stiffness: 140 },
            });
            const boxOpacity = interpolate(boxEnter, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const boxScale = interpolate(boxEnter, [0, 1], [0.88, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${box.x}%`,
                  top: `${box.y}%`,
                  width: `${box.width}%`,
                  height: `${box.height}%`,
                  border: `3px solid ${brand.colors.primary}`,
                  borderRadius: 12,
                  boxShadow: `0 0 24px ${hexToRgba(brand.colors.primary, 0.5)}, inset 0 0 0 1px ${hexToRgba(brand.colors.primary, 0.4)}`,
                  opacity: boxOpacity,
                  transform: `scale(${boxScale})`,
                  transformOrigin: "center",
                }}
              >
                {box.label && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      marginTop: 12,
                      fontFamily: brand.font.family,
                      fontSize: 22,
                      fontWeight: 700,
                      color: brand.colors.primary,
                      padding: "6px 14px",
                      borderRadius: 8,
                      background: hexToRgba(brand.colors.primary, 0.12),
                      border: `1px solid ${hexToRgba(brand.colors.primary, 0.4)}`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {box.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </SceneBackground>
  );
};

export default UIShowcase;
