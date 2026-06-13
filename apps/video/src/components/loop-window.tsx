import type { ReactNode } from "react";

const CONTENT_WIDTH = 1920;
const CONTENT_HEIGHT = 1080;
const WINDOW_WIDTH = 1600;
const WINDOW_SCALE = WINDOW_WIDTH / CONTENT_WIDTH;

export function LoopWindow({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 90,
        left: (CONTENT_WIDTH - WINDOW_WIDTH) / 2,
        width: WINDOW_WIDTH,
        height: CONTENT_HEIGHT * WINDOW_SCALE,
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.35)",
        boxShadow:
          "0 30px 80px -20px rgba(30,30,30,0.35), 0 10px 30px -15px rgba(30,30,30,0.2)",
      }}
    >
      <div
        style={{
          width: CONTENT_WIDTH,
          height: CONTENT_HEIGHT,
          transform: `scale(${WINDOW_SCALE})`,
          transformOrigin: "top left",
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
}
