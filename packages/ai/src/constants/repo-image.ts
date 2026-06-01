import type { FontSpec } from "@notra/ai/types/repo-image";

export const AGENT_TIMEOUT_MS = 480_000;
export const RECOVERY_AGENT_TIMEOUT_MS = 180_000;
export const REPO_IMAGE_OUTPUT_HTML_PATH = "/workspace/home/output.html";

export const REPO_IMAGE_WIDTH = 1200;
export const REPO_IMAGE_HEIGHT = 630;

export const GOOGLE_FONT_URL_REGEX =
  /src: url\((.+?)\) format\('(opentype|truetype)'\)/;

export const FONT_SPECS = [
  { name: "Inter", weight: 400, family: "Inter" },
  { name: "Inter", weight: 700, family: "Inter:wght@700" },
  { name: "Geist", weight: 400, family: "Geist" },
  { name: "Geist", weight: 700, family: "Geist:wght@700" },
  { name: "Instrument Serif", weight: 400, family: "Instrument Serif" },
  { name: "JetBrains Mono", weight: 500, family: "JetBrains Mono:wght@500" },
] satisfies FontSpec[];

export const ALLOWED_FONTS = ["Inter", "Geist"];

export const SATORI_VALID_DISPLAY = new Set(["flex", "contents", "none"]);

export const STYLE_ATTR_RE = /style\s*=\s*(['"])([\s\S]*?)\1/i;
export const DISPLAY_STYLE_RE = /(^|;)\s*display\s*:/i;
export const LEADING_STYLE_SEPARATOR_RE = /^\s*;?/;

export const TEN_MINUTES_MS = 600_000;
