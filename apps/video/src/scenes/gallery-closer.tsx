import { GalleryCard } from "../components/gallery-card";
import { FigmaLogo, PaperLogo } from "../components/logos";
import { COPY, GALLERY_COPY } from "../lib/copy";
import { interFamily } from "../lib/fonts";
import { COLORS } from "../lib/theme";

const TARGETS = [
  { id: "paper", label: "Paper", node: <PaperLogo size={34} /> },
  { id: "figma", label: "Figma", node: <FigmaLogo size={34} /> },
];

function CloserFooter() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 40,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
        {TARGETS.map((target) => (
          <div
            key={target.id}
            style={{ display: "flex", alignItems: "center", gap: 16 }}
          >
            {target.node}
            <span
              style={{
                fontFamily: interFamily,
                fontSize: 34,
                fontWeight: 500,
                color: COLORS.foreground,
              }}
            >
              {target.label}
            </span>
          </div>
        ))}
      </div>
      <span
        style={{
          fontFamily: interFamily,
          fontSize: 23,
          fontWeight: 400,
          color: COLORS.mutedForeground,
        }}
      >
        {COPY.affiliation}
      </span>
    </div>
  );
}

export function GalleryCloser() {
  const copy = GALLERY_COPY.closer;

  return (
    <GalleryCard
      footer={<CloserFooter />}
      headlineAccent={copy.headlineAccent}
      headlinePost={copy.headlinePost}
      headlinePre={copy.headlinePre}
      layout="centered"
      sub={copy.sub}
    />
  );
}
