import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { AURORA_PALETTES, AuroraBackdrop } from "../components/aurora-backdrop";
import { Cursor } from "../components/cursor";
import { DashboardWindow } from "../components/dashboard-window";
import { FigmaLogo, PaperLogo, WonderLogo } from "../components/logos";
import { RealImage } from "../components/real-image";
import { TitleCard } from "../components/title-card";
import {
  ChevronDownIcon,
  DownloadIcon,
  DropdownItem,
  DropdownMenuCard,
  OutlineButton,
  Toast,
} from "../components/ui";
import { COPY } from "../lib/copy";
import { interFamily } from "../lib/fonts";
import { steadyTransform } from "../lib/steady";
import { COLORS } from "../lib/theme";

export const ASSETS_LOOP_DURATION = 300;

const IMAGE_WIDTH = 1000;
const WINDOW_LEFT = 160;
const WINDOW_TOP = 80;
const ZOOM = 1.3;
const ZOOM_ORIGIN = { x: 1250, y: 450 };
const ZOOM_SHIFT = { x: -130, y: 180 };

const REVEAL_AT = 78;
const ACTIONS_AT = 86;

const CHEVRON_HOVER = 112;
const CHEVRON_CLICK = 122;
const MENU_OPEN_END = CHEVRON_CLICK + 10;
const PAPER_HOVER = 146;
const PAPER_CLICK = 158;
const MENU_CLOSED = PAPER_CLICK + 7;
const COPY_HOVER = 176;
const COPY_CLICK = 186;
const TOAST_AT = COPY_CLICK + 5;
const TOAST_OUT = 252;

const RISE = Easing.bezier(0.16, 1, 0.3, 1);

interface LoopStep {
  id: string;
  label: string;
  sub: string;
  start: number;
  done: number;
}

const LOOP_STEPS: LoopStep[] = [
  {
    id: "brand",
    label: "Fetching your website",
    sub: "Brand identity: colors, fonts, logo",
    start: 4,
    done: 38,
  },
  {
    id: "repo",
    label: "Scanning your repo",
    sub: "generalaction/emdash: real UI components",
    start: 16,
    done: 58,
  },
  {
    id: "generate",
    label: "Generating image...",
    sub: "Composing layout in your brand",
    start: 58,
    done: Number.POSITIVE_INFINITY,
  },
];

function LoopSpinner({ frame }: { frame: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={22}
      style={{ transform: `rotate(${(frame * 16) % 360}deg)` }}
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

function LoopStepCheck({ progress }: { progress: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={22}
      style={{ transform: `scale(${0.7 + 0.3 * progress})` }}
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

function LoopStepRow({ step, frame }: { step: LoopStep; frame: number }) {
  const appear = interpolate(frame, [step.start, step.start + 10], [0, 1], {
    easing: RISE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const canFinish = Number.isFinite(step.done);
  const checkPop = canFinish
    ? interpolate(frame, [step.done, step.done + 8], [0, 1], {
        easing: Easing.bezier(0.34, 1.56, 0.64, 1),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const isDone = canFinish && frame >= step.done;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        width: 460,
        opacity: appear,
        ...steadyTransform(`translateY(${(1 - appear) * 14}px)`),
      }}
    >
      {isDone ? (
        <LoopStepCheck progress={checkPop} />
      ) : (
        <LoopSpinner frame={frame} />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span
          style={{
            fontFamily: interFamily,
            fontSize: 19,
            fontWeight: 500,
            color: isDone ? COLORS.mutedForeground : COLORS.foreground,
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
  );
}

function LoopShimmer({ frame }: { frame: number }) {
  const sweep = ((frame * 16) % (IMAGE_WIDTH + 400)) - 400;

  return (
    <div
      style={{
        width: IMAGE_WIDTH,
        height: IMAGE_WIDTH * (630 / 1200),
        borderRadius: 8,
        background: COLORS.muted,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 26,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: sweep,
          width: 320,
          background:
            "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0) 100%)",
        }}
      />
      {LOOP_STEPS.map((step) => (
        <LoopStepRow frame={frame} key={step.id} step={step} />
      ))}
    </div>
  );
}

export function AssetsLoop() {
  const frame = useCurrentFrame();

  const reveal = interpolate(frame, [REVEAL_AT, REVEAL_AT + 18], [0, 1], {
    easing: RISE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const actions = interpolate(frame, [ACTIONS_AT, ACTIONS_AT + 14], [0, 1], {
    easing: RISE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const menuOpen = interpolate(
    frame,
    [CHEVRON_CLICK + 2, MENU_OPEN_END],
    [0, 1],
    {
      easing: RISE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const menuClose = interpolate(frame, [PAPER_CLICK + 2, MENU_CLOSED], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const menuProgress = menuOpen * (1 - menuClose);
  const paperSelected = frame >= PAPER_CLICK;
  const paperHovered = frame >= PAPER_HOVER && frame < PAPER_CLICK;

  const toastIn = interpolate(frame, [TOAST_AT, TOAST_AT + 14], [0, 1], {
    easing: RISE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const toastOut = interpolate(frame, [TOAST_OUT, TOAST_OUT + 14], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const toast = toastIn * (1 - toastOut);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AuroraBackdrop
        frame={frame}
        loopDuration={ASSETS_LOOP_DURATION}
        palette={AURORA_PALETTES.violet}
      />
      <AbsoluteFill>
        <AbsoluteFill
          style={{
            transform: `translate(${ZOOM_SHIFT.x}px, ${ZOOM_SHIFT.y}px) scale(${ZOOM})`,
            transformOrigin: `${ZOOM_ORIGIN.x}px ${ZOOM_ORIGIN.y}px`,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: WINDOW_TOP,
              left: WINDOW_LEFT,
            }}
          >
            <DashboardWindow
              actions={
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    opacity: actions,
                    ...steadyTransform(`translateY(${(1 - actions) * -8}px)`),
                  }}
                >
                  <OutlineButton>
                    <DownloadIcon size={16} />
                    Download image
                  </OutlineButton>
                  <div style={{ display: "flex" }}>
                    <OutlineButton
                      groupPosition="left"
                      hovered={frame >= COPY_HOVER && frame < COPY_CLICK}
                      pressed={frame >= COPY_CLICK && frame < COPY_CLICK + 6}
                    >
                      {paperSelected ? (
                        <PaperLogo size={16} />
                      ) : (
                        <FigmaLogo size={16} />
                      )}
                      Copy for {paperSelected ? "Paper" : "Figma"}
                    </OutlineButton>
                    <OutlineButton
                      groupPosition="right"
                      hovered={frame >= CHEVRON_HOVER && frame < CHEVRON_CLICK}
                      pressed={frame >= CHEVRON_CLICK && frame < PAPER_CLICK}
                    >
                      <ChevronDownIcon size={16} />
                    </OutlineButton>
                  </div>
                </div>
              }
              title={COPY.windowTitle}
            >
              <TitleCard heading={COPY.contentTitle} height={700}>
                <div style={{ position: "relative" }}>
                  {reveal < 1 ? (
                    <div style={{ opacity: 1 - reveal }}>
                      <LoopShimmer frame={frame} />
                    </div>
                  ) : null}
                  <div
                    style={{
                      position: reveal < 1 ? "absolute" : "relative",
                      inset: 0,
                      opacity: reveal,
                      ...steadyTransform(`scale(${0.965 + 0.035 * reveal})`),
                      filter:
                        reveal < 1 ? `blur(${(1 - reveal) * 8}px)` : undefined,
                      borderRadius: 8,
                      overflow: "hidden",
                      boxShadow: "0 4px 24px rgba(30,30,30,0.08)",
                    }}
                  >
                    <RealImage width={IMAGE_WIDTH} />
                  </div>
                </div>
              </TitleCard>
            </DashboardWindow>
            {menuProgress > 0 ? (
              <div style={{ position: "absolute", top: 112, right: 24 }}>
                <DropdownMenuCard progress={menuProgress}>
                  <DropdownItem
                    highlighted={paperHovered || paperSelected}
                    icon={<PaperLogo size={16} />}
                    label="Copy for Paper"
                    selected={paperSelected}
                  />
                  <DropdownItem
                    icon={<FigmaLogo size={16} />}
                    label="Copy for Figma"
                    selected={!paperSelected}
                  />
                  <DropdownItem
                    disabled
                    icon={<WonderLogo color={COLORS.foreground} size={16} />}
                    label="Copy for Wonder"
                    sublabel="Coming soon"
                  />
                </DropdownMenuCard>
              </div>
            ) : null}
            {toast > 0 ? (
              <div style={{ position: "absolute", right: 24, top: 600 }}>
                <Toast
                  body={COPY.toastBody}
                  progress={toast}
                  title={COPY.toastTitle}
                />
              </div>
            ) : null}
          </div>
          <Cursor
            clickFrames={[CHEVRON_CLICK, PAPER_CLICK, COPY_CLICK]}
            keyframes={[
              { frame: 0, x: 980, y: 860 },
              { frame: 96, x: 980, y: 860 },
              { frame: 114, x: 1712, y: 160 },
              { frame: CHEVRON_CLICK + 4, x: 1712, y: 160 },
              { frame: 144, x: 1628, y: 206 },
              { frame: PAPER_CLICK + 4, x: 1628, y: 206 },
              { frame: 174, x: 1600, y: 160 },
              { frame: COPY_CLICK + 8, x: 1600, y: 160 },
              { frame: 230, x: 1320, y: 560 },
            ]}
            size={44}
            variantKeyframes={[
              { frame: CHEVRON_HOVER - 6, variant: "handpointing" },
              { frame: COPY_CLICK + 10, variant: "default" },
            ]}
          />
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
