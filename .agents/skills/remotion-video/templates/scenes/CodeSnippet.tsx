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

export const CodeSnippet: React.FC<SceneProps<"CodeSnippet">> = ({
  language,
  code,
  emphasizedLines,
  caption,
  chapters,
}) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Resolve which lines to emphasize + which caption to show.
  // If chapters provided, walk through them based on frame; extra frames hold
  // on the last chapter. Otherwise fall back to the static `emphasizedLines`.
  let activeEmphasis: readonly number[] | undefined = emphasizedLines;
  let activeCaption = caption;
  if (chapters && chapters.length > 0) {
    let elapsed = 0;
    let active = chapters[chapters.length - 1]; // default: hold on last
    for (const ch of chapters) {
      if (frame < elapsed + ch.durationFrames) {
        active = ch;
        break;
      }
      elapsed += ch.durationFrames;
    }
    activeEmphasis = active.lines;
    activeCaption = active.caption ?? caption;
  }

  return (
    <SceneBackground variant="diagonal">
      <AbsoluteFill
        style={{
          padding: 80,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {activeCaption && (
          <div
            key={activeCaption}
            style={{
              fontFamily: brand.font.family,
              fontSize: 56,
              fontWeight: 800,
              color: brand.colors.text,
              marginBottom: 40,
              opacity: fadeIn,
              textAlign: "center",
              transition: "opacity 300ms ease",
            }}
          >
            <Highlight text={activeCaption} />
          </div>
        )}
        <div
          style={{
            position: "relative",
            opacity: fadeIn,
            minWidth: "60%",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -20,
              left: 24,
              fontFamily: brand.font.family,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "0.12em",
              padding: "6px 14px",
              borderRadius: 8,
              background: brand.colors.primary,
              color: "#000000",
              zIndex: 1,
            }}
          >
            {language.toUpperCase()}
          </div>
          <div
            style={{
              fontSize: 36,
              lineHeight: 1.5,
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 20,
              padding: 40,
              fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
              backdropFilter: "blur(2px)",
              boxShadow: `0 0 0 1px ${hexToRgba(brand.colors.primary, 0.25)}, 0 20px 60px ${hexToRgba(brand.colors.primary, 0.12)}`,
            }}
          >
            <HighlightedCode
              code={code}
              emphasizedLines={activeEmphasis}
              lang={language}
            />
          </div>
        </div>
      </AbsoluteFill>
    </SceneBackground>
  );
};

export default CodeSnippet;
