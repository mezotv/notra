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

export function CheckIcon({
  size = 16,
  color = COLORS.foreground,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      fill="none"
      height={size}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.2}
      viewBox="0 0 24 24"
      width={size}
    >
      <path d="m5 13 4 4L19 7" />
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

interface DropdownItemProps {
  icon: ReactNode;
  label: string;
  sublabel?: string;
  selected?: boolean;
  disabled?: boolean;
  highlighted?: boolean;
}

export function DropdownItem({
  icon,
  label,
  sublabel,
  selected = false,
  disabled = false,
  highlighted = false,
}: DropdownItemProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: sublabel ? "flex-start" : "center",
        gap: 10,
        padding: "8px 10px",
        borderRadius: 7,
        background: highlighted ? COLORS.muted : "transparent",
        opacity: disabled ? 0.5 : 1,
        fontFamily: interFamily,
        fontSize: 14,
        color: COLORS.foreground,
      }}
    >
      <div style={{ marginTop: sublabel ? 2 : 0, display: "flex" }}>{icon}</div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <span>{label}</span>
        {sublabel ? (
          <span style={{ fontSize: 12, color: COLORS.mutedForeground }}>
            {sublabel}
          </span>
        ) : null}
      </div>
      {selected ? <CheckIcon size={15} /> : null}
    </div>
  );
}

interface DropdownMenuCardProps {
  children: ReactNode;
  progress: number;
}

export function DropdownMenuCard({
  children,
  progress,
}: DropdownMenuCardProps) {
  return (
    <div
      style={{
        width: 232,
        padding: 5,
        background: COLORS.background,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        boxShadow:
          "0 10px 38px -10px rgba(22,23,24,0.2), 0 10px 20px -15px rgba(22,23,24,0.12)",
        opacity: progress,
        ...steadyTransform(
          `scale(${0.95 + 0.05 * progress}) translateY(${(1 - progress) * -4}px)`
        ),
        transformOrigin: "top right",
      }}
    >
      {children}
    </div>
  );
}

interface ToastProps {
  title: string;
  body: string;
  progress: number;
}

export function Toast({ title, body, progress }: ToastProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        width: 360,
        padding: "14px 16px",
        background: COLORS.background,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
        opacity: progress,
        ...steadyTransform(`translateY(${(1 - progress) * 24}px)`),
        fontFamily: interFamily,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 22,
          height: 22,
          borderRadius: 11,
          background: "#16a34a",
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <CheckIcon color="#ffffff" size={13} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{ fontSize: 14, fontWeight: 600, color: COLORS.foreground }}
        >
          {title}
        </span>
        <span style={{ fontSize: 13, color: COLORS.mutedForeground }}>
          {body}
        </span>
      </div>
    </div>
  );
}

interface BadgeProps {
  children: ReactNode;
}

export function Badge({ children }: BadgeProps) {
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 999,
        background: COLORS.muted,
        border: `1px solid ${COLORS.border}`,
        fontFamily: interFamily,
        fontSize: 12,
        fontWeight: 500,
        color: COLORS.mutedForeground,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
