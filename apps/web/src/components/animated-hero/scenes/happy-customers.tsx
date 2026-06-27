import { BrushUnderline } from "../components/brush-underline";
import { InitialsAvatar } from "../components/initials-avatar";
import { X } from "../components/tweet";
import { CUSTOMER_MESSAGES, type CustomerMessage } from "../lib/copy";
import { interFamily, serifFamily } from "../lib/fonts";
import { steadyTransform } from "../lib/steady";
import { BEAT, COLORS } from "../lib/theme";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "../remotion";

const POP = Easing.bezier(0.34, 1.56, 0.64, 1);
const RISE = Easing.bezier(0.16, 1, 0.3, 1);
const FIRST_AT = Math.round(0.6 * BEAT);
const STAGGER = 11;
const CARD_WIDTH = 720;
const TIMES = ["2m", "5m", "8m", "12m"] as const;

function HeartIcon() {
  return (
    <svg fill={X.like} height={20} viewBox="0 0 24 24" width={20}>
      <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" />
    </svg>
  );
}

function MessageCard({
  message,
  time,
  progress,
}: {
  message: CustomerMessage;
  time: string;
  progress: number;
}) {
  return (
    <div
      style={{
        width: CARD_WIDTH,
        display: "flex",
        gap: 16,
        padding: "20px 24px",
        background: X.bg,
        border: `1px solid ${X.border}`,
        borderRadius: 22,
        boxShadow: "0 18px 44px -26px rgba(15,20,25,0.32)",
        opacity: progress,
        ...steadyTransform(
          `translateY(${(1 - progress) * 34}px) scale(${0.92 + 0.08 * progress})`
        ),
      }}
    >
      <InitialsAvatar accent={message.accent} name={message.name} size={54} />
      <div
        style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: X.text }}>
            {message.name}
          </span>
          <span style={{ fontSize: 21, color: X.muted }}>
            {message.handle} · {time}
          </span>
        </div>
        <span style={{ fontSize: 25, lineHeight: 1.35, color: X.text }}>
          {message.text}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          alignSelf: "flex-end",
        }}
      >
        <HeartIcon />
        <span style={{ fontSize: 19, color: X.muted, fontFamily: interFamily }}>
          {12 + message.text.length}
        </span>
      </div>
    </div>
  );
}

export function HappyCustomers() {
  const frame = useCurrentFrame();

  const title = interpolate(frame, [4, 22], [0, 1], {
    easing: RISE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const underline = interpolate(frame, [22, 42], [0, 1], {
    easing: Easing.bezier(0.65, 0, 0.35, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.stage,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 92,
          fontFamily: serifFamily,
          fontSize: 64,
          color: COLORS.ink,
          opacity: title,
          ...steadyTransform(`translateY(${(1 - title) * 22}px)`),
        }}
      >
        Your users{" "}
        <span style={{ position: "relative", display: "inline-block" }}>
          deserve
          <BrushUnderline progress={underline} />
        </span>{" "}
        to know
      </span>

      <div
        style={{
          marginTop: 120,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {CUSTOMER_MESSAGES.map((message, index) => {
          const appearAt = FIRST_AT + index * STAGGER;
          const progress = interpolate(
            frame,
            [appearAt, appearAt + 16],
            [0, 1],
            {
              easing: POP,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }
          );
          return (
            <MessageCard
              key={message.id}
              message={message}
              progress={progress}
              time={TIMES[index] ?? "now"}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
