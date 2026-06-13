import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { interFamily, serifFamily } from "../lib/fonts";
import { COLORS } from "../lib/theme";
import type { GalleryCardProps } from "../types/video";
import { NotraMarkSvg } from "./notra-mark";

const PAD = 140;

export const GALLERY_BG =
  "radial-gradient(135% 110% at 50% -10%, #ffffff 0%, #f6f3f1 62%, #f1ede9 100%)";

export function Headline({
  headlinePre,
  headlineAccent,
  headlinePost,
  centered,
}: {
  headlinePre: string;
  headlineAccent?: string;
  headlinePost?: string;
  centered?: boolean;
}) {
  return (
    <h1
      style={{
        fontFamily: serifFamily,
        fontSize: centered ? 132 : 108,
        lineHeight: 1.0,
        fontWeight: 400,
        color: COLORS.ink,
        margin: 0,
        maxWidth: centered ? 2000 : 980,
        textAlign: centered ? "center" : "left",
      }}
    >
      {headlinePre}
      {headlineAccent ? (
        <span style={{ color: COLORS.primary }}>{headlineAccent}</span>
      ) : null}
      {headlinePost}
    </h1>
  );
}

export function BrandLockup({ centered }: { centered?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        alignSelf: centered ? "center" : "flex-start",
      }}
    >
      <NotraMarkSvg size={62} />
      <span
        style={{
          fontFamily: interFamily,
          fontSize: 44,
          fontWeight: 600,
          letterSpacing: -1.5,
          color: COLORS.ink,
        }}
      >
        Notra
      </span>
    </div>
  );
}

function CardText({
  headlinePre,
  headlineAccent,
  headlinePost,
  sub,
  centered,
}: {
  headlinePre: string;
  headlineAccent?: string;
  headlinePost?: string;
  sub?: string;
  centered?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 28,
        alignItems: centered ? "center" : "flex-start",
        textAlign: centered ? "center" : "left",
      }}
    >
      <Headline
        centered={centered}
        headlineAccent={headlineAccent}
        headlinePost={headlinePost}
        headlinePre={headlinePre}
      />
      {sub ? (
        <p
          style={{
            fontFamily: interFamily,
            fontSize: 37,
            fontWeight: 400,
            lineHeight: 1.45,
            color: COLORS.mutedForeground,
            margin: 0,
            maxWidth: centered ? 1500 : 980,
          }}
        >
          {sub}
        </p>
      ) : null}
    </div>
  );
}

export function GalleryCard({
  headlinePre,
  headlineAccent,
  headlinePost,
  sub,
  layout = "centered",
  mediaSide = "right",
  visual,
  footer,
}: GalleryCardProps) {
  const centered = layout === "centered";

  const text = (
    <CardText
      centered={centered}
      headlineAccent={headlineAccent}
      headlinePost={headlinePost}
      headlinePre={headlinePre}
      sub={sub}
    />
  );

  return (
    <AbsoluteFill
      style={{ background: GALLERY_BG, WebkitFontSmoothing: "antialiased" }}
    >
      {centered ? (
        <AbsoluteFill
          style={{
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 48,
            padding: PAD,
            boxSizing: "border-box",
          }}
        >
          <BrandLockup centered />
          {text}
          {visual}
          {footer}
        </AbsoluteFill>
      ) : (
        <AbsoluteFill>
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: 1000,
              [mediaSide === "left" ? "right" : "left"]: PAD,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 40,
            }}
          >
            <BrandLockup />
            {text}
          </div>
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              [mediaSide === "left" ? "left" : "right"]: -150,
              display: "flex",
              alignItems: "center",
            }}
          >
            {visual}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

export function Media({
  width,
  height,
  scale,
  children,
}: {
  width: number;
  height: number;
  scale: number;
  children: ReactNode;
}) {
  return (
    <div style={{ width: width * scale, height: height * scale }}>
      <div
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
