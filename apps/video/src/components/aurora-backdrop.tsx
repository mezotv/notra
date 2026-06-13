import { AbsoluteFill } from "remotion";

export interface AuroraPalette {
  base: string;
  glowA: string;
  glowB: string;
  glowC: string;
  glowD: string;
  sheen: string;
}

export const AURORA_PALETTES = {
  violet: {
    base: "linear-gradient(150deg, #f0abfc 0%, #d946ef 22%, #8b5cf6 48%, #4c1d95 78%, #1e1b4b 100%)",
    glowA: "rgba(251,113,133,0.8)",
    glowB: "rgba(251,146,60,0.55)",
    glowC: "rgba(103,232,249,0.4)",
    glowD: "rgba(196,181,253,0.65)",
    sheen: "rgba(255,255,255,0.16)",
  },
  rose: {
    base: "linear-gradient(150deg, #fde68a 0%, #fb923c 22%, #f43f5e 48%, #be185d 78%, #581c87 100%)",
    glowA: "rgba(167,139,250,0.7)",
    glowB: "rgba(253,224,71,0.45)",
    glowC: "rgba(244,114,182,0.55)",
    glowD: "rgba(254,205,211,0.55)",
    sheen: "rgba(255,255,255,0.14)",
  },
  dusk: {
    base: "linear-gradient(150deg, #99f6e4 0%, #22d3ee 20%, #6366f1 50%, #7e22ce 78%, #1e1b4b 100%)",
    glowA: "rgba(232,121,249,0.7)",
    glowB: "rgba(251,146,60,0.4)",
    glowC: "rgba(74,222,128,0.35)",
    glowD: "rgba(199,210,254,0.6)",
    sheen: "rgba(255,255,255,0.15)",
  },
} as const satisfies Record<string, AuroraPalette>;

interface AuroraBackdropProps {
  frame: number;
  loopDuration: number;
  palette: AuroraPalette;
}

export function AuroraBackdrop({
  frame,
  loopDuration,
  palette,
}: AuroraBackdropProps) {
  const t = (Math.PI * 2 * frame) / loopDuration;
  const driftX = Math.sin(t) * 60;
  const driftY = Math.cos(t) * 40;

  return (
    <AbsoluteFill style={{ background: palette.base }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 700px at ${420 + driftX}px ${260 + driftY}px, ${palette.glowA}, transparent 65%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(1100px 800px at ${1560 - driftX}px ${900 - driftY}px, ${palette.glowB}, transparent 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(800px 600px at ${1720 + driftY}px ${120 + driftX}px, ${palette.glowC}, transparent 65%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(700px 900px at ${180 - driftY}px ${980 + driftX}px, ${palette.glowD}, transparent 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(115deg, transparent ${34 + driftX / 12}%, ${palette.sheen} ${48 + driftX / 12}%, transparent ${62 + driftX / 12}%)`,
        }}
      />
    </AbsoluteFill>
  );
}
