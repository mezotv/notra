import { COLORS } from "../lib/theme";

export function BrushUnderline({ progress }: { progress: number }) {
  if (progress <= 0) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "-4%",
        bottom: -14,
        width: "108%",
        height: 22,
        overflow: "visible",
      }}
      viewBox="0 0 200 22"
    >
      <path
        d="M4 14 C 42 8, 96 6, 196 9"
        fill="none"
        pathLength={1}
        stroke={COLORS.primary}
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
        strokeLinecap="round"
        strokeWidth={9}
      />
      <path
        d="M10 18 C 60 14, 120 12, 178 15"
        fill="none"
        opacity={0.55}
        pathLength={1}
        stroke={COLORS.primary}
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
        strokeLinecap="round"
        strokeWidth={5}
      />
    </svg>
  );
}
