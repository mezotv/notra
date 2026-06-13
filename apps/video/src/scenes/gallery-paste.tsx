import { AbsoluteFill } from "remotion";
import { DashboardShot } from "../components/dashboard-shot";
import { BrandLockup, GALLERY_BG, Media } from "../components/gallery-card";
import { FigmaLogo, PaperLogo } from "../components/logos";
import { serifFamily } from "../lib/fonts";
import { COLORS } from "../lib/theme";

function LogoWord({
  logo,
  children,
}: {
  logo: React.ReactNode;
  children: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 22,
        verticalAlign: "baseline",
      }}
    >
      {logo}
      {children}
    </span>
  );
}

export function GalleryPaste() {
  return (
    <AbsoluteFill
      style={{ background: GALLERY_BG, WebkitFontSmoothing: "antialiased" }}
    >
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 150,
          display: "flex",
          flexDirection: "column",
          gap: 40,
        }}
      >
        <BrandLockup />
        <h1
          style={{
            fontFamily: serifFamily,
            fontSize: 132,
            lineHeight: 1.0,
            fontWeight: 400,
            color: COLORS.ink,
            margin: 0,
          }}
        >
          One click to <LogoWord logo={<PaperLogo size={86} />}>Paper</LogoWord>{" "}
          or <LogoWord logo={<FigmaLogo size={92} />}>Figma</LogoWord>.
        </h1>
      </div>

      <div style={{ position: "absolute", left: -120, bottom: -130 }}>
        <Media height={920} scale={1.28} width={1600}>
          <DashboardShot state="menu" />
        </Media>
      </div>
    </AbsoluteFill>
  );
}
