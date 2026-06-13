import { AbsoluteFill } from "remotion";
import { BrushUnderline } from "../components/brush-underline";
import { DashboardShot } from "../components/dashboard-shot";
import {
  WINDOW_HEIGHT,
  WINDOW_WIDTH,
} from "../components/dashboard-window";
import { GALLERY_BG } from "../components/gallery-card";
import { FigmaLogo, PaperLogo } from "../components/logos";
import { NotraMarkSvg } from "../components/notra-mark";
import { interFamily, serifFamily } from "../lib/fonts";
import { COLORS } from "../lib/theme";
import type { ThumbnailExportChipProps } from "../types/video";

const SHOT_SCALE = 0.66;

function Eyebrow() {
  return (
    <span
      style={{
        fontFamily: interFamily,
        fontSize: 19,
        fontWeight: 600,
        letterSpacing: 2.5,
        textTransform: "uppercase",
        color: COLORS.primary,
        background: "rgba(139, 92, 246, 0.12)",
        padding: "8px 16px",
        borderRadius: 999,
      }}
    >
      Image generation
    </span>
  );
}

function ExportChip({ icon, label }: ThumbnailExportChipProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "9px 16px",
        borderRadius: 12,
        background: COLORS.background,
        border: `1px solid ${COLORS.border}`,
        fontFamily: interFamily,
        fontSize: 21,
        fontWeight: 500,
        color: COLORS.ink,
        boxShadow: "0 4px 14px -6px rgba(30,30,30,0.18)",
      }}
    >
      {icon}
      {label}
    </div>
  );
}

export function YoutubeThumbnail() {
  return (
    <AbsoluteFill
      style={{ background: GALLERY_BG, WebkitFontSmoothing: "antialiased" }}
    >
      <div
        style={{
          position: "absolute",
          right: -288,
          top: 58,
          transform: "rotate(-5deg)",
          filter: "drop-shadow(0 40px 80px rgba(30,30,30,0.26))",
        }}
      >
        <div
          style={{
            width: WINDOW_WIDTH * SHOT_SCALE,
            height: WINDOW_HEIGHT * SHOT_SCALE,
          }}
        >
          <div
            style={{
              width: WINDOW_WIDTH,
              height: WINDOW_HEIGHT,
              transform: `scale(${SHOT_SCALE})`,
              transformOrigin: "top left",
            }}
          >
            <DashboardShot state="image" />
          </div>
        </div>
      </div>

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(100deg, #f6f3f1 0%, #f6f3f1 46%, rgba(246,243,241,0) 66%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 84,
          top: 0,
          bottom: 0,
          width: 660,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 30,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <NotraMarkSvg size={46} />
          <span
            style={{
              fontFamily: interFamily,
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: -1.2,
              color: COLORS.ink,
            }}
          >
            Notra
          </span>
        </div>

        <div style={{ display: "flex" }}>
          <Eyebrow />
        </div>

        <h1
          style={{
            fontFamily: serifFamily,
            fontSize: 88,
            lineHeight: 1.04,
            fontWeight: 400,
            color: COLORS.ink,
            margin: 0,
            whiteSpace: "nowrap",
          }}
        >
          Launch visuals from
          <br />
          <span style={{ position: "relative", display: "inline-block" }}>
            your codebase
            <BrushUnderline progress={1} />
          </span>
        </h1>

        <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
          <ExportChip icon={<PaperLogo size={21} />} label="Paper" />
          <ExportChip icon={<FigmaLogo size={21} />} label="Figma" />
        </div>
      </div>
    </AbsoluteFill>
  );
}
