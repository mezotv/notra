import { DashboardWindow } from "../components/dashboard-window";
import { FigmaLogo } from "../components/logos";
import { RealImage } from "../components/real-image";
import { TitleCard } from "../components/title-card";
import { ChevronDownIcon, DownloadIcon, OutlineButton } from "../components/ui";
import { COPY } from "../lib/copy";
import { interFamily, serifFamily } from "../lib/fonts";
import { steadyTransform } from "../lib/steady";
import { BEAT, COLORS } from "../lib/theme";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "../remotion";

const REVEAL_AT = 5 * BEAT;
const SHIFT_AT = 6 * BEAT;
const IMAGE_WIDTH = 1000;

const RISE = Easing.bezier(0.16, 1, 0.3, 1);

interface GenStep {
  id: string;
  label: string;
  sub: string;
  start: number;
  done: number;
}

const GEN_STEPS: GenStep[] = [
  {
    id: "brand",
    label: "Fetching your website",
    sub: "Brand identity: colors, fonts, logo",
    start: 0,
    done: 2 * BEAT,
  },
  {
    id: "repo",
    label: "Scanning your repo",
    sub: "generalaction/emdash: real UI components",
    start: BEAT,
    done: 3 * BEAT,
  },
  {
    id: "generate",
    label: "Generating image...",
    sub: "Composing layout in your brand",
    start: 3 * BEAT,
    done: Number.POSITIVE_INFINITY,
  },
];

function Spinner({ frame }: { frame: number }) {
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

function StepCheck({ progress }: { progress: number }) {
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

function StepRow({ step, frame }: { step: GenStep; frame: number }) {
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
      {isDone ? <StepCheck progress={checkPop} /> : <Spinner frame={frame} />}
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

function Shimmer({ frame }: { frame: number }) {
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
      {GEN_STEPS.map((step) => (
        <StepRow frame={frame} key={step.id} step={step} />
      ))}
    </div>
  );
}

export function Generation() {
  const frame = useCurrentFrame();

  const reveal = interpolate(frame, [REVEAL_AT, REVEAL_AT + 18], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const actions = interpolate(frame, [REVEAL_AT + 10, REVEAL_AT + 24], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const shift = interpolate(frame, [SHIFT_AT, SHIFT_AT + 26], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headline = interpolate(frame, [SHIFT_AT + 10, SHIFT_AT + 28], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headlineSub = interpolate(
    frame,
    [SHIFT_AT + 18, SHIFT_AT + 36],
    [0, 1],
    {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <AbsoluteFill
      style={{
        background: COLORS.stage,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 130,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 26,
        }}
      >
        <span
          style={{
            fontFamily: serifFamily,
            fontSize: 110,
            color: COLORS.ink,
            opacity: headline,
            marginRight: "0.27em",
            ...steadyTransform(`translateY(${(1 - headline) * 26}px)`),
          }}
        >
          Pixel{" "}
          <span
            style={{
              background: "linear-gradient(180deg, #a78bfa 0%, #7c3aed 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            perfect
          </span>
        </span>
        <span
          style={{
            fontFamily: interFamily,
            fontSize: 32,
            fontWeight: 500,
            color: COLORS.mutedForeground,
            opacity: headlineSub,
            ...steadyTransform(`translateY(${(1 - headlineSub) * 18}px)`),
          }}
        >
          {COPY.pixelPerfectSub}
        </span>
      </div>
      <div style={steadyTransform(`translateY(${shift * 380}px)`)}>
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
                <OutlineButton groupPosition="left">
                  <FigmaLogo size={16} />
                  Copy for Figma
                </OutlineButton>
                <OutlineButton groupPosition="right">
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
                  <Shimmer frame={frame} />
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
      </div>
      <span
        style={{
          position: "absolute",
          bottom: 24,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: interFamily,
          fontSize: 17,
          color: COLORS.mutedForeground,
          opacity: reveal * 0.9 * (1 - shift),
        }}
      >
        {COPY.disclaimer}
      </span>
    </AbsoluteFill>
  );
}
