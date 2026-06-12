import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FigmaLogo, PaperLogo } from "../components/logos";
import { COPY } from "../lib/copy";
import { interFamily, serifFamily } from "../lib/fonts";
import { steadyTransform } from "../lib/steady";
import { COLORS } from "../lib/theme";

const TILES = [
  { name: "Paper", logo: <PaperLogo size={88} /> },
  { name: "Figma", logo: <FigmaLogo size={88} /> },
] as const;

export function Targets() {
  const frame = useCurrentFrame();

  const title = interpolate(frame, [16, 34], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.stage,
        alignItems: "center",
        justifyContent: "center",
        gap: 64,
      }}
    >
      <span
        style={{
          fontFamily: serifFamily,
          fontSize: 60,
          color: COLORS.ink,
          opacity: title,
          ...steadyTransform(`translateY(${(1 - title) * 22}px)`),
        }}
      >
        {COPY.targets}
      </span>
      <div style={{ display: "flex", gap: 48 }}>
        {TILES.map((tile, index) => {
          const appearAt = 4 + index * 7;
          const pop = interpolate(frame, [appearAt, appearAt + 14], [0, 1], {
            easing: Easing.bezier(0.34, 1.45, 0.64, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={tile.name}
              style={{
                width: 300,
                height: 300,
                borderRadius: 28,
                background: COLORS.background,
                border: `1px solid ${COLORS.border}`,
                boxShadow: "0 20px 50px -20px rgba(30,30,30,0.18)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 24,
                opacity: pop,
                ...steadyTransform(
                  `scale(${0.8 + 0.2 * pop}) translateY(${(1 - pop) * 30}px)`
                ),
              }}
            >
              {tile.logo}
              <span
                style={{
                  fontFamily: interFamily,
                  fontSize: 26,
                  fontWeight: 600,
                  color: COLORS.foreground,
                }}
              >
                {tile.name}
              </span>
            </div>
          );
        })}
      </div>
      <span
        style={{
          position: "absolute",
          bottom: 28,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: interFamily,
          fontSize: 15,
          color: COLORS.mutedForeground,
          opacity: title * 0.75,
        }}
      >
        {COPY.affiliation}
      </span>
    </AbsoluteFill>
  );
}
