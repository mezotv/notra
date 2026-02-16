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
      aria-hidden="true"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: 29, height: 20 }}
      viewBox="140 240 520 360"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M174.167 363.25V498.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="40"
      />
      <path
        d="M241.917 472.989V431C241.917 388.417 241.917 367.124 255.146 353.896C268.375 340.666 289.666 340.667 332.25 340.667H422.583C443.629 340.667 454.15 340.666 462.452 344.105C473.518 348.689 482.312 357.482 486.896 368.549C490.334 376.849 490.334 387.371 490.334 408.417H558.084V374.542C558.084 364.019 558.084 358.758 559.802 354.608C562.094 349.074 566.491 344.678 572.024 342.386C576.175 340.667 581.437 340.667 591.959 340.667C602.48 340.667 607.742 340.667 611.893 342.386C617.426 344.678 621.823 349.074 624.115 354.608C625.834 358.758 625.834 364.019 625.834 374.542V532.625C625.834 543.146 625.834 548.408 624.115 552.559C621.823 558.092 617.426 562.489 611.893 564.781C607.742 566.5 602.48 566.5 591.959 566.5C581.437 566.5 576.175 566.5 572.024 564.781C566.491 562.489 562.094 558.092 559.802 552.559C558.084 548.408 558.084 543.146 558.084 532.625V476.167H490.334C490.334 518.75 490.334 540.041 477.104 553.271C463.875 566.5 442.583 566.5 400 566.5H337.017C323.442 566.5 316.654 566.5 310.253 564.562C303.853 562.625 298.205 558.858 286.909 551.328L282.142 548.151C262.451 535.023 252.605 528.458 247.261 518.472C241.917 508.488 241.917 496.654 241.917 472.989Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="40"
      />
      <path
        d="M241.917 431H174.167"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="40"
      />
      <path
        d="M366.125 340.667V272.917"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="40"
      />
      <path
        d="M287.083 272.917H445.167"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="40"
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
