import { AbsoluteFill } from "remotion";
import { BrushUnderline } from "../components/brush-underline";
import { DashboardShot } from "../components/dashboard-shot";
import { BrandLockup, GALLERY_BG, Media } from "../components/gallery-card";
import { serifFamily } from "../lib/fonts";
import { COLORS } from "../lib/theme";

const IMAGE_SCALE = 1.26;
const IMAGE_WIDTH = 1600 * IMAGE_SCALE;

export function GalleryHero() {
  return (
    <AbsoluteFill
      style={{ background: GALLERY_BG, WebkitFontSmoothing: "antialiased" }}
    >
      <div
        style={{
          position: "absolute",
          top: 150,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 48,
        }}
      >
        <BrandLockup centered />
        <h1
          style={{
            fontFamily: serifFamily,
            fontSize: 156,
            lineHeight: 1.0,
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
      </div>

      <div
        style={{
          position: "absolute",
          bottom: -240,
          left: (2540 - IMAGE_WIDTH) / 2,
        }}
      >
        <Media height={920} scale={IMAGE_SCALE} width={1600}>
          <DashboardShot state="image" />
        </Media>
      </div>
    </AbsoluteFill>
  );
}
