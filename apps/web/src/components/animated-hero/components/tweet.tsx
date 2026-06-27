import { type ReactNode, useState } from "react";
import { interFamily } from "../lib/fonts";

export const X = {
  bg: "#ffffff",
  text: "#0f1419",
  muted: "#536471",
  border: "#eff3f4",
  mediaBorder: "#cfd9de",
  blue: "#1d9bf0",
  like: "#f91880",
} as const;

const ICON = 25;

interface TweetProps {
  name: string;
  handle: string;
  time: string;
  text: string;
  avatar: ReactNode;
  media?: ReactNode;
  replies: string;
  reposts: string;
  likes: string;
  likesLiked?: string;
  views: string;
  width?: number;
}

function VerifiedBadge({ size }: { size: number }) {
  return (
    <svg height={size} viewBox="0 0 24 24" width={size}>
      <path
        d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
        fill={X.blue}
      />
      <path
        d="m9.8 17.3-4.35-4.35 1.42-1.42 2.93 2.93 6.73-6.73 1.42 1.42z"
        fill="#ffffff"
      />
    </svg>
  );
}

function ReplyIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg fill={color} height={size} viewBox="0 0 24 24" width={size}>
      <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z" />
    </svg>
  );
}

function RepostIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg fill={color} height={size} viewBox="0 0 24 24" width={size}>
      <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" />
    </svg>
  );
}

const HEART_OUTLINE =
  "M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z";
const HEART_SOLID =
  "M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z";

function LikeIcon({ size, filled }: { size: number; filled: boolean }) {
  return (
    <svg
      fill={filled ? X.like : X.muted}
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path d={filled ? HEART_SOLID : HEART_OUTLINE} />
    </svg>
  );
}

function ViewsIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg fill={color} height={size} viewBox="0 0 24 24" width={size}>
      <path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z" />
    </svg>
  );
}

function ShareIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg fill={color} height={size} viewBox="0 0 24 24" width={size}>
      <path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z" />
    </svg>
  );
}

function DotsIcon({ size }: { size: number }) {
  return (
    <svg fill={X.muted} height={size} viewBox="0 0 24 24" width={size}>
      <circle cx={5} cy={12} r={2} />
      <circle cx={12} cy={12} r={2} />
      <circle cx={19} cy={12} r={2} />
    </svg>
  );
}

function Count({ value, color }: { value: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 21,
        color,
        fontFamily: interFamily,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </span>
  );
}

function Action({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      {icon}
      <Count color={X.muted} value={value} />
    </div>
  );
}

function LikeButton({
  likes,
  likesLiked,
}: {
  likes: string;
  likesLiked: string;
}) {
  const [liked, setLiked] = useState(false);

  return (
    <button
      aria-label={liked ? "Unlike" : "Like"}
      aria-pressed={liked}
      onClick={() => setLiked((value) => !value)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: 0,
        margin: 0,
        border: "none",
        outline: "none",
        background: "none",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
      }}
      tabIndex={-1}
      type="button"
    >
      <LikeIcon filled={liked} size={ICON} />
      <Count
        color={liked ? X.like : X.muted}
        value={liked ? likesLiked : likes}
      />
    </button>
  );
}

export function Tweet({
  name,
  handle,
  time,
  text,
  avatar,
  media,
  replies,
  reposts,
  likes,
  likesLiked,
  views,
  width = 760,
}: TweetProps) {
  return (
    <div
      style={{
        width,
        background: X.bg,
        border: `1px solid ${X.border}`,
        borderRadius: 24,
        boxShadow: "0 30px 80px -28px rgba(15,20,25,0.28)",
        padding: "26px 28px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        fontFamily: interFamily,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {avatar}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: X.text }}>
              {name}
            </span>
            <VerifiedBadge size={24} />
          </div>
          <span style={{ fontSize: 23, color: X.muted }}>
            {handle} · {time}
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <DotsIcon size={26} />
      </div>

      <span
        style={{
          fontSize: 31,
          lineHeight: 1.4,
          color: X.text,
          whiteSpace: "pre-line",
        }}
      >
        {text}
      </span>

      {media ? (
        <div
          style={{
            borderRadius: 20,
            overflow: "hidden",
            border: `1px solid ${X.mediaBorder}`,
            display: "flex",
          }}
        >
          {media}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 8,
          borderTop: `1px solid ${X.border}`,
          marginTop: 4,
        }}
      >
        <Action
          icon={<ReplyIcon color={X.muted} size={ICON} />}
          value={replies}
        />
        <Action
          icon={<RepostIcon color={X.muted} size={ICON} />}
          value={reposts}
        />
        <LikeButton likes={likes} likesLiked={likesLiked ?? likes} />
        <Action
          icon={<ViewsIcon color={X.muted} size={ICON} />}
          value={views}
        />
        <ShareIcon color={X.muted} size={ICON} />
      </div>
    </div>
  );
}
