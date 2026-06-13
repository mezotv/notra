import { COPY } from "../lib/copy";
import { interFamily } from "../lib/fonts";
import { COLORS } from "../lib/theme";
import type { DashboardShotState } from "../types/video";
import { DashboardWindow } from "./dashboard-window";
import { FigmaLogo, PaperLogo } from "./logos";
import { RealImage } from "./real-image";
import { TitleCard } from "./title-card";
import {
  ChevronDownIcon,
  DownloadIcon,
  DropdownItem,
  DropdownMenuCard,
  OutlineButton,
} from "./ui";

const IMAGE_WIDTH = 1000;

const STEPS = [
  {
    id: "brand",
    label: "Fetching your website",
    sub: "Brand identity: colors, fonts, logo",
    done: true,
  },
  {
    id: "repo",
    label: "Scanning your repo",
    sub: "generalaction/emdash: real UI components",
    done: true,
  },
  {
    id: "generate",
    label: "Generating image...",
    sub: "Composing layout in your brand",
    done: false,
  },
] as const;

function StepCheck() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={22}
      viewBox="0 0 22 22"
      width={22}
    >
      <circle cx={11} cy={11} fill="#16a34a" r={10} />
      <path
        d="m6.5 11.5 3 3 6-6.5"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.2}
      />
    </svg>
  );
}

function StepSpinner() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={22}
      viewBox="0 0 22 22"
      width={22}
    >
      <circle
        cx={11}
        cy={11}
        opacity={0.25}
        r={8.5}
        stroke="#b9b3ab"
        strokeWidth={2.4}
      />
      <path
        d="M11 2.5a8.5 8.5 0 0 1 8.5 8.5"
        stroke={COLORS.primary}
        strokeLinecap="round"
        strokeWidth={2.4}
      />
    </svg>
  );
}

function StepsPanel() {
  return (
    <div
      style={{
        width: IMAGE_WIDTH,
        height: IMAGE_WIDTH * (630 / 1200),
        borderRadius: 8,
        background: COLORS.muted,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 26,
      }}
    >
      {STEPS.map((step) => (
        <div
          key={step.id}
          style={{ display: "flex", alignItems: "center", gap: 16, width: 460 }}
        >
          {step.done ? <StepCheck /> : <StepSpinner />}
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span
              style={{
                fontFamily: interFamily,
                fontSize: 19,
                fontWeight: 500,
                color: step.done ? COLORS.mutedForeground : COLORS.foreground,
              }}
            >
              {step.label}
            </span>
            <span
              style={{
                fontFamily: interFamily,
                fontSize: 14.5,
                color: COLORS.mutedForeground,
                opacity: 0.85,
              }}
            >
              {step.sub}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function GeneratedImage() {
  return (
    <div
      style={{
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: "0 4px 24px rgba(30,30,30,0.08)",
      }}
    >
      <RealImage width={IMAGE_WIDTH} />
    </div>
  );
}

function Actions({ menuOpen }: { menuOpen: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <OutlineButton>
        <DownloadIcon size={16} />
        Download image
      </OutlineButton>
      <div style={{ display: "flex" }}>
        <OutlineButton groupPosition="left">
          <PaperLogo size={16} />
          Copy for Paper
        </OutlineButton>
        <OutlineButton groupPosition="right" pressed={menuOpen}>
          <ChevronDownIcon size={16} />
        </OutlineButton>
      </div>
    </div>
  );
}

export function DashboardShot({ state }: { state: DashboardShotState }) {
  const menuOpen = state === "menu";

  return (
    <div style={{ position: "relative" }}>
      <DashboardWindow
        actions={<Actions menuOpen={menuOpen} />}
        title={COPY.windowTitle}
      >
        <TitleCard heading={COPY.contentTitle} height={700}>
          {state === "generating" ? <StepsPanel /> : <GeneratedImage />}
        </TitleCard>
      </DashboardWindow>
      {menuOpen ? (
        <div style={{ position: "absolute", top: 92, right: 24 }}>
          <DropdownMenuCard progress={1}>
            <DropdownItem
              icon={<PaperLogo size={16} />}
              label="Copy for Paper"
              selected
            />
            <DropdownItem
              icon={<FigmaLogo size={16} />}
              label="Copy for Figma"
            />
          </DropdownMenuCard>
        </div>
      ) : null}
    </div>
  );
}
