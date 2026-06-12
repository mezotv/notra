import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { brand } from "../brand";
import { Highlight } from "../highlight";
import { HighlightedCode } from "../highlighted-code";
import { SceneBackground } from "../scene-background";
import type { SceneContent, SceneProps } from "../story-types";

const hexToRgba = (hex: string, alpha: number) => {
  const clean = hex.replace("#", "");
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const Panel: React.FC<{
  side: SceneContent;
  accent: string;
  icon: string;
  slideFrom: number;
  frame: number;
  focusOpacity: number;
  emphasizedLines?: readonly number[];
  errorColor?: string;
}> = ({
  side,
  accent,
  icon,
  slideFrom,
  frame,
  focusOpacity,
  emphasizedLines,
  errorColor,
}) => {
  const x = interpolate(frame, [0, 18], [slideFrom, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const enterOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        transform: `translateX(${x}px) scale(${0.97 + focusOpacity * 0.03})`,
        opacity: enterOpacity * (0.35 + focusOpacity * 0.65),
        filter: `blur(${(1 - focusOpacity) * 1.5}px)`,
        transition:
          "opacity 600ms ease, filter 600ms ease, transform 600ms ease",
        padding: 24,
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 20,
        borderTop: `6px solid ${accent}`,
        backdropFilter: "blur(2px)",
        boxShadow: `0 0 0 1px ${hexToRgba(accent, 0.3)}, 0 20px 60px ${hexToRgba(accent, 0.15)}`,
      }}
    >
      <div
        style={{
          fontFamily: brand.font.family,
          fontSize: 32,
          fontWeight: 800,
          color: accent,
          marginBottom: 16,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          display: "flex",
          alignItems: "center",
          gap: 12,
          textAlign: "left",
        }}
      >
        <span>{icon}</span>
        <span>{side.label}</span>
      </div>
      {side.code && side.language ? (
        <div
          style={{
            fontSize: 20,
            lineHeight: 1.55,
            fontFamily: "'Fira Code', monospace",
            color: brand.colors.text,
            textAlign: "left",
            overflow: "hidden",
          }}
        >
          <HighlightedCode
            code={side.code}
            emphasizedLines={emphasizedLines}
            errorColor={errorColor}
            errorLines={side.errorLines}
            lang={side.language}
          />
        </div>
      ) : (
        <div
          style={{
            fontFamily: brand.font.family,
            fontSize: 32,
            color: brand.colors.text,
            textAlign: "left",
          }}
        >
          {side.label}
        </div>
      )}
    </div>
  );
};

export const BeforeAfter: React.FC<SceneProps<"BeforeAfter">> = ({
  before,
  after,
  caption,
  chapters,
}) => {
  const frame = useCurrentFrame();
  const captionOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Resolve the active chapter from the current frame.
  // `focus` fades the non-focused panel down and blurs it; `beforeLines` /
  // `afterLines` drive per-line emphasis inside the focused panel.
  let activeFocus: "before" | "after" | "both" = "both";
  let activeCaption = caption;
  let beforeLines: readonly number[] | undefined;
  let afterLines: readonly number[] | undefined;
  if (chapters && chapters.length > 0) {
    let elapsed = 0;
    let active = chapters[chapters.length - 1];
    for (const ch of chapters) {
      if (frame < elapsed + ch.durationFrames) {
        active = ch;
        break;
      }
      elapsed += ch.durationFrames;
    }
    activeFocus = active.focus;
    activeCaption = active.caption ?? caption;
    beforeLines = active.beforeLines;
    afterLines = active.afterLines;
  }

  const beforeFocus =
    activeFocus === "before" ? 1 : activeFocus === "both" ? 1 : 0;
  const afterFocus =
    activeFocus === "after" ? 1 : activeFocus === "both" ? 1 : 0;

  return (
    <SceneBackground variant="primary-glow">
      <AbsoluteFill
        style={{
          padding: 80,
          justifyContent: "center",
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
              textAlign: "center",
              opacity: captionOpacity,
              transition: "opacity 300ms ease",
            }}
          >
            <Highlight text={activeCaption} />
          </div>
        )}
        <div style={{ display: "flex", gap: 40, alignItems: "stretch" }}>
          <Panel
            accent={brand.colors.danger}
            emphasizedLines={beforeLines}
            errorColor={brand.colors.danger}
            focusOpacity={beforeFocus}
            frame={frame}
            icon="❌"
            side={before}
            slideFrom={-60}
          />
          <Panel
            accent={brand.colors.success}
            emphasizedLines={afterLines}
            errorColor={brand.colors.danger}
            focusOpacity={afterFocus}
            frame={frame}
            icon="✅"
            side={after}
            slideFrom={60}
          />
        </div>
      </AbsoluteFill>
    </SceneBackground>
  );
};

export default BeforeAfter;
