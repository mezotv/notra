import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { AURORA_PALETTES, AuroraBackdrop } from "../components/aurora-backdrop";
import { ConfettiBurst } from "../components/confetti-burst";
import { LoopWindow } from "../components/loop-window";
import { PaperChrome } from "../components/paper-shell";
import { RealImage } from "../components/real-image";
import { interFamily } from "../lib/fonts";
import { PAPER_COLORS, PAPER_UI, PASTED_LAYERS } from "../lib/paper";
import { steadyTransform } from "../lib/steady";
import { COLORS } from "../lib/theme";
import type { PaperRowReveal } from "../types/paper";

export const PAPER_LOOP_DURATION = 270;

const PASTE_AT = 46;
const ROWS_FROM = 116;
const ZOOM = 1.3;
const ZOOM_ORIGIN = { x: 900, y: 540 };
const ZOOM_SHIFT = { x: 212, y: 195 };

const IMAGE_WIDTH = 1040;
const IMAGE_HEIGHT = IMAGE_WIDTH * (630 / 1200);
const IMAGE_LEFT =
  PAPER_UI.chromeWidth + (1920 - PAPER_UI.chromeWidth - IMAGE_WIDTH) / 2;
const IMAGE_TOP = (1080 - IMAGE_HEIGHT) / 2;

const RISE = Easing.bezier(0.16, 1, 0.3, 1);

function Keycaps({
  progress,
  cmdPress,
  vPress,
}: {
  progress: number;
  cmdPress: number;
  vPress: number;
}) {
  const keys = [
    { label: "⌘", press: cmdPress },
    { label: "V", press: vPress },
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: PAPER_UI.chromeWidth + (1920 - PAPER_UI.chromeWidth) / 2 - 90,
        top: 96,
        display: "flex",
        gap: 10,
        opacity: progress,
        ...steadyTransform(
          `translateY(${(1 - progress) * 16}px) scale(${0.92 + 0.08 * progress})`
        ),
      }}
    >
      {keys.map(({ label, press }) => (
        <div
          key={label}
          style={{
            width: 80,
            height: 80,
            borderRadius: 14,
            background: "#ffffff",
            border: `1px solid ${COLORS.border}`,
            boxShadow: `0 ${6 - 5 * press}px 0 #d8d4cf, 0 ${8 - 6 * press}px ${16 - 11 * press}px rgba(0,0,0,${0.12 - 0.05 * press})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: interFamily,
            fontSize: 32,
            fontWeight: 500,
            color: COLORS.foreground,
            ...steadyTransform(`translateY(${5 * press}px)`),
          }}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

export function PaperPasteLoop() {
  const frame = useCurrentFrame();

  const keycapsIn = interpolate(frame, [12, 20], [0, 1], {
    easing: RISE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const keycapsOut = interpolate(
    frame,
    [PASTE_AT + 16, PASTE_AT + 28],
    [0, 1],
    {
      easing: Easing.in(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const cmdDown = interpolate(frame, [PASTE_AT - 10, PASTE_AT - 6], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cmdUp = interpolate(frame, [PASTE_AT + 10, PASTE_AT + 19], [0, 1], {
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const vDown = interpolate(frame, [PASTE_AT - 2, PASTE_AT + 3], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const vUp = interpolate(frame, [PASTE_AT + 6, PASTE_AT + 15], [0, 1], {
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const drop = interpolate(frame, [PASTE_AT, PASTE_AT + 22], [0, 1], {
    easing: RISE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pasted: PaperRowReveal[] = PASTED_LAYERS.map((layer, index) => {
    if (index === 0) {
      return { layer, progress: drop };
    }
    const appearAt = ROWS_FROM + (index - 1) * 8;
    return {
      layer,
      progress: interpolate(frame, [appearAt, appearAt + 16], [0, 1], {
        easing: RISE,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    };
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AuroraBackdrop
        frame={frame}
        loopDuration={PAPER_LOOP_DURATION}
        palette={AURORA_PALETTES.rose}
      />
      <AbsoluteFill>
        <AbsoluteFill
          style={{
            transform: `translate(${ZOOM_SHIFT.x}px, ${ZOOM_SHIFT.y}px) scale(${ZOOM})`,
            transformOrigin: `${ZOOM_ORIGIN.x}px ${ZOOM_ORIGIN.y}px`,
          }}
        >
          <LoopWindow>
            <AbsoluteFill style={{ background: PAPER_COLORS.canvas }}>
              <AbsoluteFill>
                <PaperChrome
                  pasted={pasted}
                  selectedId={drop > 0.5 ? PASTED_LAYERS[0].id : undefined}
                />
                <ConfettiBurst
                  originX={IMAGE_LEFT + IMAGE_WIDTH / 2}
                  originY={IMAGE_TOP + IMAGE_HEIGHT / 2}
                  spreadX={IMAGE_WIDTH / 2}
                  spreadY={IMAGE_HEIGHT / 2}
                  startFrame={PASTE_AT + 5}
                />
                {drop > 0 ? (
                  <div
                    style={{
                      position: "absolute",
                      left: IMAGE_LEFT,
                      top: IMAGE_TOP,
                      opacity: drop,
                      ...steadyTransform(`scale(${1.07 - 0.07 * drop})`),
                      boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
                      outline: `2px solid ${COLORS.paperBlue}`,
                    }}
                  >
                    <RealImage width={IMAGE_WIDTH} />
                  </div>
                ) : null}
                {drop > 0 ? (
                  <div
                    style={{
                      position: "absolute",
                      left: IMAGE_LEFT,
                      top: IMAGE_TOP - 32,
                      fontFamily: interFamily,
                      fontSize: 14,
                      fontWeight: 500,
                      color: COLORS.paperBlue,
                      opacity: drop,
                    }}
                  >
                    emdash-launch-image
                  </div>
                ) : null}
                <Keycaps
                  cmdPress={cmdDown * (1 - cmdUp)}
                  progress={keycapsIn * (1 - keycapsOut)}
                  vPress={vDown * (1 - vUp)}
                />
              </AbsoluteFill>
            </AbsoluteFill>
          </LoopWindow>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
