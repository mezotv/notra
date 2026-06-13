import { AbsoluteFill } from "remotion";
import { BrushUnderline } from "../components/brush-underline";
import { GALLERY_BG } from "../components/gallery-card";
import { NotraMarkSvg } from "../components/notra-mark";
import { interFamily, serifFamily } from "../lib/fonts";
import { COLORS } from "../lib/theme";

const SAFE_WIDTH = 1546;

export function GalleryBanner() {
  return (
    <AbsoluteFill
      style={{
        background: GALLERY_BG,
        WebkitFontSmoothing: "antialiased",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: SAFE_WIDTH,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <NotraMarkSvg size={70} />
          <span
            style={{
              fontFamily: interFamily,
              fontSize: 52,
              fontWeight: 600,
              letterSpacing: -1.5,
              color: COLORS.ink,
            }}
          >
            Notra
          </span>
        </div>
        <h1
          style={{
            fontFamily: serifFamily,
            fontSize: 104,
            lineHeight: 1.02,
            fontWeight: 400,
            color: COLORS.ink,
            margin: 0,
            textAlign: "center",
          }}
        >
          Visuals from{" "}
          <span style={{ position: "relative", display: "inline-block" }}>
            your
            <BrushUnderline progress={1} />
          </span>{" "}
          codebase.
        </h1>
        <span
          style={{
            fontFamily: interFamily,
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: 0.5,
            color: COLORS.mutedForeground,
          }}
        >
          Image generation for your product launch · usenotra.com
        </span>
      </div>
    </AbsoluteFill>
  );
}
