import type { CSSProperties } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { interFamily, serifFamily } from "../lib/fonts";
import { steadyTransform } from "../lib/steady";
import { COLORS } from "../lib/theme";
import type { TextSlideProps } from "../types/video";
import { BrushUnderline } from "./brush-underline";

const WORD_STAGGER = 4;
const WORD_DURATION = 18;
const FOLD_STAGGER = 6;
const FOLD_DURATION = 22;
const FLIP_FRAMES = 18;
const FOLD_TO_SIZE = 92;
const RISE = Easing.bezier(0.16, 1, 0.3, 1);
const FOLD = Easing.bezier(0.34, 1.3, 0.64, 1);

function AccentText({ text }: { text: string }) {
  const hasDot = text.endsWith(".");
  const word = hasDot ? text.slice(0, -1) : text;

  return (
    <>
      <span
        style={{
          background: "linear-gradient(180deg, #a78bfa 0%, #7c3aed 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        {word}
      </span>
      {hasDot ? "." : null}
    </>
  );
}

export function TextSlide({
  title,
  sub,
  accent,
  entrance = "rise",
  foldTo,
  foldToAccent,
  foldToUnderline,
  foldAt,
}: TextSlideProps) {
  const frame = useCurrentFrame();
  const words = title.split(" ");
  const folded = entrance === "fold";
  const stagger = folded ? FOLD_STAGGER : WORD_STAGGER;
  const duration = folded ? FOLD_DURATION : WORD_DURATION;

  const flipStart = foldAt ?? words.length * stagger + 24;
  const flip = foldTo
    ? interpolate(frame, [flipStart, flipStart + FLIP_FRAMES], [0, 1], {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const titleAngle = interpolate(flip, [0, 0.5], [0, -90], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const targetAngle = interpolate(flip, [0.5, 1], [90, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const underlineProgress = foldTo
    ? interpolate(
        frame,
        [flipStart + FLIP_FRAMES + 4, flipStart + FLIP_FRAMES + 18],
        [0, 1],
        {
          easing: Easing.out(Easing.cubic),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }
      )
    : 0;

  const subProgress = interpolate(
    frame,
    [words.length * stagger + 8, words.length * stagger + 24],
    [0, 1],
    {
      easing: RISE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const glow = interpolate(frame, [0, 30], [0, 0.7], {
    easing: RISE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.stage,
        alignItems: "center",
        justifyContent: "center",
        gap: 36,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(circle, ${COLORS.border} 1.5px, transparent 1.5px)`,
          backgroundSize: "44px 44px",
          opacity: 0.35,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 42% 32% at 50% 48%, ${COLORS.lavender}40 0%, ${COLORS.lavender}00 70%)`,
          opacity: glow,
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: serifFamily,
            fontSize: 132,
            color: COLORS.ink,
            display: "flex",
            gap: 32,
            marginRight: "0.27em",
            opacity: flip < 0.5 ? 1 : 0,
            transform: foldTo
              ? `perspective(1200px) rotateX(${titleAngle}deg)`
              : undefined,
            transformOrigin: "50% 50%",
            willChange: foldTo ? "transform" : undefined,
          }}
        >
          {words.map((word, index) => {
            const start = index * stagger;
            const progress = interpolate(
              frame,
              [start, start + duration],
              [0, 1],
              {
                easing: folded ? FOLD : RISE,
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }
            );
            const wordBlur = folded ? 0 : interpolate(progress, [0, 1], [8, 0]);

            const wordStyle: CSSProperties = folded
              ? {
                  opacity: Math.min(1, progress * 2.5),
                  transform: `perspective(1200px) rotateX(${(1 - progress) * -90}deg)`,
                  transformOrigin: "50% 0%",
                  willChange: "transform",
                }
              : {
                  opacity: progress,
                  ...steadyTransform(`translateY(${(1 - progress) * 30}px)`),
                  filter: wordBlur > 0.1 ? `blur(${wordBlur}px)` : undefined,
                };

            return (
              <span key={`${word}-${index.toString()}`} style={wordStyle}>
                {accent?.split(" ").includes(word) ? (
                  <AccentText text={word} />
                ) : (
                  word
                )}
              </span>
            );
          })}
        </span>
        {foldTo ? (
          <span
            style={{
              position: "absolute",
              whiteSpace: "nowrap",
              fontFamily: serifFamily,
              fontSize: FOLD_TO_SIZE,
              color: COLORS.ink,
              opacity: flip >= 0.5 ? 1 : 0,
              transform: `perspective(1200px) rotateX(${targetAngle}deg)`,
              transformOrigin: "50% 50%",
              willChange: "transform",
            }}
          >
            {foldTo.split(" ").map((word, index) => {
              const content = foldToAccent?.split(" ").includes(word) ? (
                <AccentText text={word} />
              ) : (
                word
              );

              return (
                <span key={`${word}-${index.toString()}`}>
                  {index > 0 ? " " : null}
                  {foldToUnderline?.split(" ").includes(word) ? (
                    <span
                      style={{ position: "relative", display: "inline-block" }}
                    >
                      {content}
                      <BrushUnderline progress={underlineProgress} />
                    </span>
                  ) : (
                    content
                  )}
                </span>
              );
            })}
          </span>
        ) : null}
      </div>
      {sub ? (
        <span
          style={{
            fontFamily: interFamily,
            fontSize: 34,
            fontWeight: 500,
            color: COLORS.mutedForeground,
            opacity: subProgress,
            ...steadyTransform(`translateY(${(1 - subProgress) * 20}px)`),
            position: "relative",
          }}
        >
          {sub}
        </span>
      ) : null}
    </AbsoluteFill>
  );
}
