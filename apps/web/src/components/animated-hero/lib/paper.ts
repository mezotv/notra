import type { PaperLayer } from "../types/paper";

export const PAPER_UI = {
  sidebarWidth: 300,
  toolbarWidth: 56,
  chromeWidth: 356,
  rowHeight: 32,
} as const;

export const PAPER_COLORS = {
  panel: "#1e1e1e",
  panelBorder: "#2d2d2d",
  text: "#e4e4e4",
  mutedText: "#979797",
  icon: "#9d9d9d",
  toolIcon: "#cfcfcf",
  activeTool: "#3d3d3d",
  selectedRow: "rgba(129,173,236,0.16)",
  canvas: "#e7e6e4",
} as const;

export const PASTED_LAYERS: PaperLayer[] = [
  { id: "pasted-frame", name: "emdash-launch-image", kind: "frame", depth: 0 },
  {
    id: "pasted-headline",
    name: "Custom sounds for agent events",
    kind: "text",
    depth: 1,
  },
  {
    id: "pasted-sub",
    name: "Use any audio file as your notification",
    kind: "text",
    depth: 1,
  },
  {
    id: "pasted-badge",
    name: "New in Settings - Notifications",
    kind: "text",
    depth: 1,
  },
  { id: "pasted-panel", name: "Settings panel", kind: "frame", depth: 1 },
  { id: "pasted-logo", name: "Emdash logo", kind: "rect", depth: 1 },
];
