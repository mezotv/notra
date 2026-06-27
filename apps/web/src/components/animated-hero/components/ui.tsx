import type { ReactNode } from "react";
import { interFamily } from "../lib/fonts";
import { steadyTransform } from "../lib/steady";
import { COLORS } from "../lib/theme";

interface OutlineButtonProps {
  children: ReactNode;
  pressed?: boolean;
  hovered?: boolean;
  groupPosition?: "left" | "right" | "solo";
}

export function OutlineButton({
  children,
  pressed = false,
  hovered = false,
  groupPosition = "solo",
}: OutlineButtonProps) {
  const radius = {
    solo: "10px",
    left: "10px 0 0 10px",
    right: "0 10px 10px 0",
  }[groupPosition];

  const background = (() => {
    if (pressed) {
      return COLORS.muted;
    }
    if (hovered) {
      return "#fafafa";
    }
    return COLORS.background;
  })();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 36,
        padding: "0 14px",
        background,
        border: `1px solid ${COLORS.border}`,
        borderRadius: radius,
        marginLeft: groupPosition === "right" ? -1 : 0,
        fontFamily: interFamily,
        fontSize: 14,
        fontWeight: 500,
        color: COLORS.foreground,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}

export function ChevronDownIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      fill="none"
      height={size}
      stroke={COLORS.foreground}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
      width={size}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function DownloadIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      fill="none"
      height={size}
      stroke={COLORS.foreground}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
      width={size}
    >
      <path d="M12 4v12m0 0 4-4m-4 4-4-4M4 20h16" />
    </svg>
  );
}

export function BackArrowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      fill="none"
      height={size}
      stroke={COLORS.mutedForeground}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
      width={size}
    >
      <path d="M19 12H5m0 0 6 6m-6-6 6-6" />
    </svg>
  );
}
