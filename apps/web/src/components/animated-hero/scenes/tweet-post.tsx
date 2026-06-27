import { EmdashLogo } from "../components/logos";
import { RealImage } from "../components/real-image";
import { Tweet } from "../components/tweet";
import { TWEET } from "../lib/copy";
import { serifFamily } from "../lib/fonts";
import { steadyTransform } from "../lib/steady";
import { COLORS } from "../lib/theme";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "../remotion";

const RISE = Easing.bezier(0.16, 1, 0.3, 1);
const CARD_WIDTH = 780;

function EmdashAvatar() {
  return (
    <span
      style={{
        width: 64,
        height: 64,
        borderRadius: 16,
        background: "#171717",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <EmdashLogo color="#fafafa" size={48} />
    </span>
  );
}

export function TweetPost() {
  const frame = useCurrentFrame();

  const title = interpolate(frame, [6, 24], [0, 1], {
    easing: RISE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const card = interpolate(frame, [10, 30], [0, 1], {
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
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 88,
          fontFamily: serifFamily,
          fontSize: 64,
          color: COLORS.ink,
          opacity: title,
          ...steadyTransform(`translateY(${(1 - title) * 22}px)`),
        }}
      >
        Shipped,{" "}
        <span
          style={{
            background: "linear-gradient(180deg, #a78bfa 0%, #7c3aed 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          posted
        </span>
        .
      </span>

      <div
        style={{
          marginTop: 104,
          opacity: card,
          ...steadyTransform(
            `translateY(${(1 - card) * 40}px) scale(${0.96 + 0.04 * card})`
          ),
        }}
      >
        <Tweet
          avatar={<EmdashAvatar />}
          handle={TWEET.handle}
          likes={TWEET.likes}
          likesLiked="3.3K"
          media={<RealImage width={CARD_WIDTH - 58} />}
          name={TWEET.name}
          replies={TWEET.replies}
          reposts={TWEET.reposts}
          text={TWEET.text}
          time={TWEET.time}
          views={TWEET.views}
          width={CARD_WIDTH}
        />
      </div>
    </AbsoluteFill>
  );
}
