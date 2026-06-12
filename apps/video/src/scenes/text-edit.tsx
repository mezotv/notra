import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Cursor } from "../components/cursor";
import { PaperChrome } from "../components/paper-shell";
import { RealImage } from "../components/real-image";
import { punchZoom } from "../lib/camera";
import { COPY } from "../lib/copy";
import { interFamily, serifFamily } from "../lib/fonts";
import { PAPER_COLORS, PAPER_UI, PASTED_LAYERS } from "../lib/paper";
import { steadyTransform } from "../lib/steady";
import { BEAT, COLORS } from "../lib/theme";
import type { PaperRowReveal } from "../types/paper";

const SELECT_AT = BEAT;
const TYPE_START = 2 * BEAT;
const CHAR_EVERY = 4;
const OLD_WORD = "sounds";
const NEW_WORD = "audio";
const TITLE_AT = 4 * BEAT;

const IMAGE_WIDTH = 1040;
const IMAGE_HEIGHT = IMAGE_WIDTH * (630 / 1200);
const IMAGE_LEFT =
  PAPER_UI.chromeWidth + (1920 - PAPER_UI.chromeWidth - IMAGE_WIDTH) / 2;
const IMAGE_TOP = (1080 - IMAGE_HEIGHT) / 2 + 60;
const SCALE = IMAGE_WIDTH / 1200;

const PATCH = {
  left: 50 * SCALE,
  top: 208 * SCALE,
  width: 420 * SCALE,
  height: 125 * SCALE,
};

const HEADLINE = {
  left: 56 * SCALE,
  top: 215 * SCALE,
  fontSize: 42 * SCALE,
  lineHeight: 1.16,
};

const TYPE_DONE = TYPE_START + NEW_WORD.length * CHAR_EVERY;
const PUNCH_ORIGIN = {
  x: IMAGE_LEFT + PATCH.left + PATCH.width / 2,
  y: IMAGE_TOP + PATCH.top + PATCH.height / 2,
};

const RISE = Easing.bezier(0.16, 1, 0.3, 1);

const PASTED_ROWS: PaperRowReveal[] = PASTED_LAYERS.map((layer) => ({
  layer,
  progress: 1,
}));

export function TextEdit() {
  const frame = useCurrentFrame();

  const selected = frame >= SELECT_AT && frame < TYPE_START;
  const typedCount =
    frame >= TYPE_START
      ? Math.min(
          NEW_WORD.length,
          Math.floor((frame - TYPE_START) / CHAR_EVERY) + 1
        )
      : 0;
  const editing = frame >= SELECT_AT;
  const typingDone = typedCount === NEW_WORD.length;
  const caretOn = !typingDone || frame % BEAT < BEAT * 0.6;
  const word = typedCount > 0 ? NEW_WORD.slice(0, typedCount) : OLD_WORD;

  const enter = interpolate(frame, [0, 16], [0, 1], {
    easing: RISE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const selectIn = interpolate(frame, [SELECT_AT, SELECT_AT + 6], [0, 1], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const title = interpolate(frame, [TITLE_AT, TITLE_AT + 16], [0, 1], {
    easing: RISE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleSub = interpolate(frame, [TITLE_AT + 8, TITLE_AT + 24], [0, 1], {
    easing: RISE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const selectedLayerId = editing ? PASTED_LAYERS[1].id : PASTED_LAYERS[0].id;

  const punch = punchZoom(frame, {
    inStart: SELECT_AT - 6,
    inEnd: SELECT_AT + 10,
    outStart: TYPE_DONE + 2,
    outEnd: TITLE_AT,
    scale: 1.1,
  });

  return (
    <AbsoluteFill style={{ background: PAPER_COLORS.canvas }}>
      <AbsoluteFill
        style={{
          ...steadyTransform(`scale(${punch})`),
          transformOrigin: `${PUNCH_ORIGIN.x}px ${PUNCH_ORIGIN.y}px`,
        }}
      >
        <PaperChrome pasted={PASTED_ROWS} selectedId={selectedLayerId} />
        <div
          style={{
            position: "absolute",
            top: 70,
            left: PAPER_UI.chromeWidth,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
          }}
        >
          <span
            style={{
              fontFamily: serifFamily,
              fontSize: 84,
              color: COLORS.ink,
              opacity: title,
              ...steadyTransform(`translateY(${(1 - title) * 24}px)`),
            }}
          >
            Edit{" "}
            <span
              style={{
                background: "linear-gradient(180deg, #a78bfa 0%, #7c3aed 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              anything
            </span>
            .
          </span>
          <span
            style={{
              fontFamily: interFamily,
              fontSize: 28,
              fontWeight: 500,
              color: COLORS.mutedForeground,
              opacity: titleSub,
              ...steadyTransform(`translateY(${(1 - titleSub) * 16}px)`),
            }}
          >
            {COPY.editSub}
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            top: IMAGE_TOP,
            left: IMAGE_LEFT,
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            outline: `2px solid ${COLORS.paperBlue}`,
            opacity: enter,
            ...steadyTransform(`translateY(${(1 - enter) * 36}px)`),
          }}
        >
          <RealImage width={IMAGE_WIDTH} />
          <div
            style={{
              position: "absolute",
              left: PATCH.left,
              top: PATCH.top,
              width: PATCH.width,
              height: PATCH.height,
              background: "#111111",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: HEADLINE.left,
              top: HEADLINE.top,
              fontFamily: interFamily,
              fontSize: HEADLINE.fontSize,
              fontWeight: 700,
              lineHeight: HEADLINE.lineHeight,
              color: "#fafafa",
              whiteSpace: "nowrap",
              outline: editing ? `2px solid ${COLORS.paperBlue}` : "none",
              outlineOffset: 8,
            }}
          >
            Custom{" "}
            <span
              style={{
                background: selected
                  ? `rgba(129,173,236,${0.45 * selectIn})`
                  : "transparent",
              }}
            >
              {word}
            </span>
            {editing && !selected ? (
              <span
                style={{
                  display: "inline-block",
                  width: 3,
                  height: HEADLINE.fontSize * 0.9,
                  marginLeft: 3,
                  verticalAlign: "-8%",
                  background: COLORS.paperBlue,
                  opacity: caretOn ? 1 : 0,
                }}
              />
            ) : null}
            <br />
            for agent events
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: IMAGE_LEFT,
            top: IMAGE_TOP - 32,
            fontFamily: interFamily,
            fontSize: 14,
            fontWeight: 500,
            color: COLORS.paperBlue,
            opacity: enter,
          }}
        >
          emdash-launch-image
        </div>
        <Cursor
          clickFrames={[SELECT_AT - 5, SELECT_AT - 1]}
          keyframes={[
            { frame: 0, x: 1560, y: 940 },
            { frame: 13, x: 858, y: 532 },
            { frame: 34, x: 858, y: 532 },
            { frame: 58, x: 1300, y: 880 },
          ]}
          size={52}
          variantKeyframes={[
            { frame: 9, variant: "textcursor" },
            { frame: 44, variant: "default" },
          ]}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
