import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { brand } from "../brand";
import { Highlight } from "../highlight";
import { HighlightedCode } from "../highlighted-code";
import { SceneBackground } from "../scene-background";
import type { SceneProps } from "../story-types";

const hexToRgba = (hex: string, alpha: number) => {
  const clean = hex.replace("#", "");
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const LibrarySwap: React.FC<SceneProps<"LibrarySwap">> = ({
  sharedCode,
  libraries,
  caption,
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  if (libraries.length === 0) {
    throw new Error(
      "LibrarySwap: libraries array is empty. The scene needs at least one library to showcase."
    );
  }
  const segment = Math.floor(durationFrames / libraries.length);
  const currentIndex = Math.min(
    Math.floor(frame / segment),
    libraries.length - 1
  );
  const current = libraries[currentIndex];

  const swapProgress = (frame % segment) / segment;
  const importScale = interpolate(swapProgress, [0, 0.15, 1], [1.2, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneBackground variant="diagonal">
      <AbsoluteFill
        style={{
          padding: 80,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {caption && (
          <div
            style={{
              fontFamily: brand.font.family,
              fontSize: 48,
              fontWeight: 800,
              color: brand.colors.text,
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            <Highlight text={caption} />
          </div>
        )}

        <div
          key={current.name}
          style={{
            fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
            fontSize: 40,
            color: brand.colors.primary,
            marginBottom: 16,
            transform: `scale(${importScale})`,
            transformOrigin: "left center",
            transition: "color 0.2s",
          }}
        >
          {current.importLine}
        </div>

        <div
          style={{
            fontSize: 36,
            lineHeight: 1.5,
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 20,
            padding: 40,
            minWidth: "60%",
            fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
            backdropFilter: "blur(2px)",
            boxShadow: `0 0 0 1px ${hexToRgba(brand.colors.primary, 0.25)}, 0 20px 60px ${hexToRgba(brand.colors.primary, 0.12)}`,
          }}
        >
          <HighlightedCode code={sharedCode} lang="ts" />
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
          {libraries.map((lib, i) => (
            <div
              key={lib.name}
              style={{
                fontFamily: brand.font.family,
                fontSize: 28,
                fontWeight: 700,
                padding: "8px 20px",
                borderRadius: 999,
                background:
                  i === currentIndex ? brand.colors.primary : "transparent",
                color:
                  i === currentIndex
                    ? brand.colors.background
                    : brand.colors.text,
                border: `2px solid ${brand.colors.primary}`,
              }}
            >
              {lib.name}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </SceneBackground>
  );
};

export default LibrarySwap;
