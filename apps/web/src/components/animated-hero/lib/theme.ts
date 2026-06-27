export const COLORS = {
  stage: "#f7f5f3",
  background: "#ffffff",
  foreground: "#171717",
  muted: "#f5f5f5",
  mutedForeground: "#737373",
  border: "#e5e5e5",
  primary: "#8b5cf6",
  primaryHover: "#7443e0",
  primaryForeground: "#fefefe",
  lavender: "#c8b2ee",
  ink: "#1e1e1e",
  cream: "#f6f3f1",
  figmaBlue: "#0d99ff",
  paperBlue: "#81adec",
} as const;

const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
  bpm: 120,
} as const;

export const BEAT = (VIDEO.fps * 60) / VIDEO.bpm;
