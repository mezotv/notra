import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { AURORA_PALETTES, AuroraBackdrop } from "../components/aurora-backdrop";
import { Cursor } from "../components/cursor";
import { LoopWindow } from "../components/loop-window";
import { PaperChrome } from "../components/paper-shell";
import { RealImage } from "../components/real-image";
import { interFamily } from "../lib/fonts";
import { PAPER_COLORS, PAPER_UI, PASTED_LAYERS } from "../lib/paper";
import { steadyTransform } from "../lib/steady";
import { COLORS } from "../lib/theme";
import type { PaperRowReveal } from "../types/paper";

export const EDIT_LOOP_DURATION = 240;

const SELECT_AT = 44;
const TYPE_START = 76;
const ZOOM = 1.45;
const ZOOM_ORIGIN = { x: 860, y: 510 };
const ZOOM_SHIFT = { x: 305, y: 250 };
const CHAR_EVERY = 5;
const OLD_WORD = "sounds";
const NEW_WORD = "audio";
const BLINK_PERIOD = 26;

const IMAGE_WIDTH = 1040;
const IMAGE_HEIGHT = IMAGE_WIDTH * (630 / 1200);
const IMAGE_LEFT =
  PAPER_UI.chromeWidth + (1920 - PAPER_UI.chromeWidth - IMAGE_WIDTH) / 2;
const IMAGE_TOP = (1080 - IMAGE_HEIGHT) / 2;
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
const WORD_TARGET = {
  x: IMAGE_LEFT + PATCH.left + PATCH.width * 0.62,
  y: IMAGE_TOP + PATCH.top + PATCH.height * 0.3,
};

const RISE = Easing.bezier(0.16, 1, 0.3, 1);

const PASTED_ROWS: PaperRowReveal[] = PASTED_LAYERS.map((layer) => ({
  layer,
  progress: 1,
}));

export function TextEditLoop() {
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
  const caretOn = !typingDone || frame % BLINK_PERIOD < BLINK_PERIOD * 0.6;
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

  const selectedLayerId = editing ? PASTED_LAYERS[1].id : PASTED_LAYERS[0].id;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AuroraBackdrop
        frame={frame}
        loopDuration={EDIT_LOOP_DURATION}
        palette={AURORA_PALETTES.dusk}
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
                  pasted={PASTED_ROWS}
                  selectedId={selectedLayerId}
                />
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
                      outline: editing
                        ? `2px solid ${COLORS.paperBlue}`
                        : "none",
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
                    { frame: 14, x: 1520, y: 920 },
                    { frame: 32, x: WORD_TARGET.x, y: WORD_TARGET.y },
                    {
                      frame: SELECT_AT + 14,
                      x: WORD_TARGET.x,
                      y: WORD_TARGET.y,
                    },
                    { frame: SELECT_AT + 38, x: 1340, y: 860 },
                  ]}
                  size={52}
                  variantKeyframes={[
                    { frame: 28, variant: "textcursor" },
                    { frame: SELECT_AT + 18, variant: "default" },
                  ]}
                />
              </AbsoluteFill>
            </AbsoluteFill>
          </LoopWindow>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
