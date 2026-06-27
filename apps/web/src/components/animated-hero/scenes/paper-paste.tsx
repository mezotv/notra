import { ConfettiBurst } from "../components/confetti-burst";
import { PaperChrome } from "../components/paper-shell";
import { RealImage } from "../components/real-image";
import { COPY } from "../lib/copy";
import { interFamily, serifFamily } from "../lib/fonts";
import { PAPER_COLORS, PAPER_UI, PASTED_LAYERS } from "../lib/paper";
import { steadyTransform } from "../lib/steady";
import { COLORS } from "../lib/theme";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "../remotion";
import type { PaperRowReveal } from "../types/paper";

const PASTE_AT = 30;
const FOCUS_AT = 75;
const ROWS_FROM = FOCUS_AT + 10;
const ZOOM = 2;

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
        bottom: 140,
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

function CanvasPhase({ frame }: { frame: number }) {
  const keycapsIn = interpolate(frame, [1, 9], [0, 1], {
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

  const frameLayer = PASTED_LAYERS[0];
  const pasted: PaperRowReveal[] = frameLayer
    ? [{ layer: frameLayer, progress: drop }]
    : [];

  return (
    <AbsoluteFill style={{ background: PAPER_COLORS.canvas }}>
      <AbsoluteFill>
        <PaperChrome
          pasted={pasted}
          selectedId={drop > 0.5 ? frameLayer?.id : undefined}
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
  );
}

function LayersPhase({ frame }: { frame: number }) {
  const fadeIn = interpolate(frame, [FOCUS_AT, FOCUS_AT + 10], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const settle = interpolate(frame, [FOCUS_AT, FOCUS_AT + 14], [0, 1], {
    easing: RISE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const title = interpolate(frame, [ROWS_FROM + 16, ROWS_FROM + 34], [0, 1], {
    easing: RISE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sub = interpolate(frame, [ROWS_FROM + 26, ROWS_FROM + 44], [0, 1], {
    easing: RISE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const zoom = ZOOM * (1.08 - 0.08 * settle);

  const pasted: PaperRowReveal[] = PASTED_LAYERS.map((layer, index) => {
    if (index === 0) {
      return { layer, progress: 1 };
    }
    const appearAt = ROWS_FROM + (index - 1) * 7;
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
    <AbsoluteFill style={{ background: PAPER_COLORS.canvas, opacity: fadeIn }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1920,
          height: 1080,
          ...steadyTransform(`scale(${zoom})`),
          transformOrigin: "top left",
        }}
      >
        <PaperChrome pasted={pasted} selectedId={PASTED_LAYERS[0]?.id} />
      </div>
      <div
        style={{
          position: "absolute",
          left: PAPER_UI.chromeWidth * ZOOM,
          right: 0,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
          padding: "0 80px",
        }}
      >
        <span
          style={{
            fontFamily: serifFamily,
            fontSize: 76,
            color: COLORS.ink,
            textAlign: "center",
            opacity: title,
            ...steadyTransform(`translateY(${(1 - title) * 26}px)`),
          }}
        >
          Organized,{" "}
          <span
            style={{
              background: "linear-gradient(180deg, #a78bfa 0%, #7c3aed 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            editable
          </span>{" "}
          layers.
        </span>
        <span
          style={{
            fontFamily: interFamily,
            fontSize: 30,
            fontWeight: 500,
            color: COLORS.mutedForeground,
            textAlign: "center",
            opacity: sub,
            ...steadyTransform(`translateY(${(1 - sub) * 18}px)`),
          }}
        >
          {COPY.layersSub}
        </span>
      </div>
    </AbsoluteFill>
  );
}

export function PaperPaste() {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: PAPER_COLORS.canvas }}>
      {frame < FOCUS_AT + 10 ? <CanvasPhase frame={frame} /> : null}
      {frame >= FOCUS_AT ? <LayersPhase frame={frame} /> : null}
    </AbsoluteFill>
  );
}
