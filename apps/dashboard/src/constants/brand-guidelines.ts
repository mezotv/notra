import type { BrandGuidelineScreenshotConfig } from "@/types/brand-guidelines";

export const BRAND_GUIDELINE_HEX_COLOR_REGEX =
  /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export const BRAND_GUIDELINE_LEADING_WWW_REGEX = /^www\./i;

export const BRAND_GUIDELINE_TRAILING_SLASH_REGEX = /\/$/;

export const BRAND_GUIDELINE_TOKEN_GROUPS = [
  "spacing",
  "elementSpacing",
  "radii",
  "radius",
];

export const BRAND_GUIDELINE_SCREENSHOT_CONFIGS = [
  {
    kind: "desktop_hero",
    width: 1440,
    height: 900,
    fullPage: false,
    sortOrder: 0,
  },
  {
    kind: "desktop_full_page",
    width: 1440,
    height: 900,
    fullPage: true,
    sortOrder: 1,
  },
  {
    kind: "mobile_hero",
    width: 390,
    height: 844,
    fullPage: false,
    sortOrder: 2,
  },
] satisfies BrandGuidelineScreenshotConfig[];
