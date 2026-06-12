import type { ReactNode } from "react";
import { interFamily } from "../lib/fonts";
import { COLORS } from "../lib/theme";

interface TitleCardProps {
  heading: string;
  children: ReactNode;
  height?: number;
}

export function TitleCard({ heading, children, height }: TitleCardProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: 10,
        border: `1px solid ${COLORS.border}`,
        background: "#fafafa",
        padding: 8,
        height,
      }}
    >
      <div style={{ padding: "6px 8px 12px" }}>
        <span
          style={{
            fontFamily: interFamily,
            fontSize: 17,
            fontWeight: 500,
            color: COLORS.foreground,
          }}
        >
          {heading}
        </span>
      </div>
      <div
        style={{
          flex: 1,
          borderRadius: 10,
          border: `1px solid ${COLORS.border}`,
          background: COLORS.background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}
