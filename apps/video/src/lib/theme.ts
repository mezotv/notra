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

export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
  bpm: 120,
} as const;

export const GALLERY = {
  width: 2540,
  height: 1520,
} as const;

export const BANNER = {
  width: 2560,
  height: 1440,
} as const;

export const BEAT = (VIDEO.fps * 60) / VIDEO.bpm;
export const BAR = BEAT * 4;

export const TRANSITION_FRAMES = 18;
export const SLIDE_FRAMES = 20;

export const SCENE_DURATIONS = {
  coldOpen: 1 * BAR,
  github: 2 * BAR,
  onePrompt: 1.5 * BAR,
  generation: 2.5 * BAR,
  designers: 1 * BAR,
  exportMenu: 2 * BAR,
  paperPaste: 2.5 * BAR,
  textEdit: 1.5 * BAR,
  targets: 1 * BAR,
  endCard: 1.5 * BAR,
} as const;

export const TOTAL_DURATION = Object.values(SCENE_DURATIONS).reduce(
  (sum, frames) => sum + frames,
  0
);
