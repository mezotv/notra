import type { ReactElement } from "react";

interface ChangelogOgTemplateProps {
  companyName: string;
  title: string;
  subtitle: string;
  showAccentDot?: boolean;
}

function NotraMark() {
  return (
    <svg
      aria-label="Notra Logo"
      fill="none"
      height="24"
      role="img"
      viewBox="0 0 800 800"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M572.881 462.223c-12.712 43.22-290.678 105.932-394.068 83.898l-48.305-10.169 48.305-78.814 68.644-104.237 73.729-106.78 251.695-127.119 78.814-22.881 17.796 17.796h10.17c17.796 35.593 3.945 147.458-12.712 195.763-25.424 73.729-124.576 96.61-177.966 114.407-4.064 1.355 96.61-5.085 83.898 38.136Z"
        fill="#c8b2ee"
        stroke="#1e1e1e"
        strokeLinecap="round"
        strokeWidth="35"
      />
      <path
        d="M700 96.111c-162.712-4.237-510.508 111.356-600 607.627"
        stroke="#1e1e1e"
        strokeLinecap="round"
        strokeWidth="75"
      />
    </svg>
  );
}

function SideRail({ side }: { side: "left" | "right" }) {
  return (
    <div
      style={{
        position: "absolute",
        [side]: 0,
        top: 0,
        display: "flex",
        width: 92,
        height: "100%",
        background: "#f1eeea",
        borderRight: side === "left" ? "1px solid #e0dedb" : "none",
        borderLeft: side === "right" ? "1px solid #e0dedb" : "none",
      }}
    />
  );
}

export function ChangelogOgTemplate({
  companyName,
  title,
  subtitle,
  showAccentDot = true,
}: ChangelogOgTemplateProps): ReactElement {
  const cleanTitle = title.endsWith(".") ? title.slice(0, -1) : title;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#f7f5f3",
        color: "#49423d",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <SideRail side="left" />
      <SideRail side="right" />

      <div
        style={{
          position: "absolute",
          left: 92,
          right: 92,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderLeft: "1px solid #e0dedb",
          borderRight: "1px solid #e0dedb",
          padding: "72px 72px 38px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <span
            style={{
              fontSize: 19,
              color: "rgba(96, 90, 87, 0.82)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 600,
            }}
          >
            Notra Changelog Example
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              flexWrap: "nowrap",
              gap: 0,
              maxWidth: "100%",
            }}
          >
            <span
              style={{
                fontSize: 68,
                lineHeight: 1.05,
                letterSpacing: "-0.035em",
                fontWeight: 700,
              }}
            >
              {cleanTitle}
            </span>
            {showAccentDot ? (
              <span
                style={{
                  color: "#8e51ff",
                  fontSize: 68,
                  lineHeight: 1.05,
                  letterSpacing: "-0.035em",
                  fontWeight: 700,
                }}
              >
                .
              </span>
            ) : null}
          </div>
          <span
            style={{
              fontSize: 30,
              lineHeight: 1.25,
              color: "rgba(96, 90, 87, 0.95)",
            }}
          >
            {subtitle}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(224, 222, 219, 1)",
            paddingTop: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              color: "rgba(73, 66, 61, 0.85)",
              fontSize: 20,
            }}
          >
            <span style={{ color: "#8e51ff", display: "flex" }}>
              <NotraMark />
            </span>
            <span>Notra is not affiliated with {companyName}.</span>
          </div>
          <span
            style={{
              fontSize: 20,
              color: "rgba(73, 66, 61, 0.62)",
              fontWeight: 600,
            }}
          >
            usenotra.com
          </span>
        </div>
      </div>
    </div>
  );
}
