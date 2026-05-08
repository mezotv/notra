import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import {
  OG_EXCLUDED_CONTRIBUTOR,
  OG_MAX_CONTRIBUTORS,
  OG_MAX_LOGIN_LENGTH,
} from "@/utils/constants";
import { fetchContributorsData } from "@/utils/github";
import { loadGoogleFont, truncate } from "@/utils/og";
import type { OgContributor } from "~types/github";

export const alt = "Notra contributors and community";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const data = await fetchContributorsData();
  const contributors: OgContributor[] = data.contributors
    .filter((c) => c.login !== OG_EXCLUDED_CONTRIBUTOR)
    .slice(0, OG_MAX_CONTRIBUTORS)
    .map((c) => ({
      ...c,
      displayLogin: truncate(c.login, OG_MAX_LOGIN_LENGTH),
    }));

  const headingText = "Built by the community.";
  const uiText = `CONTRIBUTORS commits commit 0123456789… ${contributors
    .map((c) => c.displayLogin)
    .join(" ")}`;

  const [serifFont, sansFont, sansBoldFont, logoSvg] = await Promise.all([
    loadGoogleFont("Instrument Serif", headingText),
    loadGoogleFont("Inter", uiText),
    loadGoogleFont("Inter:wght@600", uiText),
    Promise.resolve(
      readFileSync(join(process.cwd(), "public/notra-mark.svg"), "utf-8")
    ),
  ]);

  const logoDataUrl = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "#f5f0e8",
        padding: "5rem",
        fontFamily: "Inter",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: next/og JSX requires native img */}
        <img alt="" height={56} src={logoDataUrl} width={56} />
        <div
          style={{
            color: "#525252",
            fontSize: "1rem",
            fontWeight: 600,
            letterSpacing: "0.24em",
          }}
        >
          CONTRIBUTORS
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: "3.5rem",
        }}
      >
        <div
          style={{
            color: "#1a1a1a",
            fontFamily: "Instrument Serif",
            fontSize: "5rem",
            lineHeight: 1.02,
            letterSpacing: "-0.01em",
          }}
        >
          Built by the
        </div>
        <div
          style={{
            display: "flex",
            color: "#1a1a1a",
            fontFamily: "Instrument Serif",
            fontSize: "5rem",
            lineHeight: 1.02,
            letterSpacing: "-0.01em",
          }}
        >
          <span>community</span>
          <span style={{ color: "#7c3aed" }}>.</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          marginTop: "auto",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        {contributors.map((c) => (
          <div
            key={c.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "9.5rem",
            }}
          >
            {/* biome-ignore lint/performance/noImgElement: next/og JSX requires native img */}
            <img
              alt=""
              height={96}
              src={c.avatar_url}
              style={{
                borderRadius: "9999px",
              }}
              width={96}
            />
            <div
              style={{
                color: "#1a1a1a",
                fontSize: "1.25rem",
                fontWeight: 600,
                marginTop: "1rem",
              }}
            >
              {c.displayLogin}
            </div>
            <div
              style={{
                color: "#525252",
                fontSize: "1rem",
                marginTop: "0.125rem",
              }}
            >
              {`${c.contributions} ${c.contributions === 1 ? "commit" : "commits"}`}
            </div>
          </div>
        ))}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Instrument Serif",
          data: serifFont,
          style: "normal",
          weight: 400,
        },
        { name: "Inter", data: sansFont, style: "normal", weight: 400 },
        { name: "Inter", data: sansBoldFont, style: "normal", weight: 600 },
      ],
    }
  );
}
