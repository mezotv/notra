import { AbsoluteFill } from "remotion";
import { BrandLockup, GALLERY_BG, Headline } from "../components/gallery-card";
import { RealImage } from "../components/real-image";
import { GALLERY_COPY } from "../lib/copy";
import { interFamily } from "../lib/fonts";
import { COLORS } from "../lib/theme";

const IMAGE_WIDTH = 1760;

function RealImageNote() {
  return (
    <>
      <span
        style={{
          position: "absolute",
          left: 150,
          top: 600,
          fontFamily: interFamily,
          fontSize: 40,
          fontWeight: 500,
          fontStyle: "italic",
          color: COLORS.mutedForeground,
          transform: "rotate(-5deg)",
        }}
      >
        real image
      </span>
      <svg
        aria-hidden="true"
        fill="none"
        height={160}
        style={{ position: "absolute", left: 270, top: 650 }}
        viewBox="0 0 210 160"
        width={210}
      >
        <path
          d="M10 6 C 60 80, 130 118, 188 132"
          stroke={COLORS.mutedForeground}
          strokeLinecap="round"
          strokeWidth={4}
        />
        <path
          d="M162 114l28 20-26 16"
          stroke={COLORS.mutedForeground}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={4}
        />
      </svg>
    </>
  );
}

export function GalleryGeneric() {
  const copy = GALLERY_COPY.generic;

  return (
    <AbsoluteFill
      style={{ background: GALLERY_BG, WebkitFontSmoothing: "antialiased" }}
    >
      <div
        style={{
          position: "absolute",
          top: 240,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 44,
        }}
      >
        <BrandLockup centered />
        <Headline
          centered
          headlineAccent={copy.headlineAccent}
          headlinePost={copy.headlinePost}
          headlinePre={copy.headlinePre}
        />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: -130,
          left: "50%",
          transform: "translateX(-50%)",
          width: IMAGE_WIDTH,
          borderRadius: 20,
          overflow: "hidden",
          border: `1px solid ${COLORS.border}`,
          boxShadow:
            "0 50px 100px -30px rgba(30,30,30,0.32), 0 18px 40px -22px rgba(30,30,30,0.2)",
        }}
      >
        <RealImage width={IMAGE_WIDTH} />
      </div>
      <RealImageNote />
    </AbsoluteFill>
  );
}
