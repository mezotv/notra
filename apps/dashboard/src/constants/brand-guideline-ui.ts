import type {
  BrandGuidelineAssetKind,
  BrandGuidelineAssetVariant,
  BrandGuidelineColorRole,
  BrandGuidelineFontRole,
  BrandGuidelineScreenshotKind,
  BrandGuidelineStatus,
  BrandGuidelineTokenType,
} from "@/types/hooks/brand-guidelines";

export const ASSET_KIND_LABELS: Record<BrandGuidelineAssetKind, string> = {
  logo: "Logo",
  wordmark: "Wordmark",
};

export const COLOR_ROLE_LABELS: Record<BrandGuidelineColorRole, string> = {
  primary: "Primary",
  secondary: "Secondary",
  accent: "Accent",
  background: "Background",
  foreground: "Foreground",
  neutral: "Neutral",
  custom: "Custom",
};

export const FONT_ROLE_LABELS: Record<BrandGuidelineFontRole, string> = {
  heading: "Heading",
  body: "Body",
  button: "Button",
  unknown: "Unknown",
};

export const TOKEN_TYPE_LABELS: Record<BrandGuidelineTokenType, string> = {
  spacing: "Spacing",
  radius: "Radius",
  shadow: "Shadow",
  component: "Component",
  unknown: "Other",
};

export const SCREENSHOT_KIND_LABELS: Record<
  BrandGuidelineScreenshotKind,
  string
> = {
  desktop_hero: "Desktop Hero",
  desktop_full_page: "Desktop Full Page",
  mobile_hero: "Mobile Hero",
};

export const STATUS_BADGE_META: Record<
  BrandGuidelineStatus,
  { label: string; variant: "secondary" | "outline" | "destructive" }
> = {
  queued: { label: "Queued", variant: "secondary" },
  generating: { label: "Generating", variant: "secondary" },
  ready: { label: "Ready", variant: "outline" },
  failed: { label: "Failed", variant: "destructive" },
};

export const TOKEN_TYPE_ORDER: BrandGuidelineTokenType[] = [
  "spacing",
  "radius",
  "shadow",
  "component",
  "unknown",
];

export const GUIDELINES_SKELETON_KEYS = ["a", "b", "c", "d", "e", "f"] as const;

export const ASSET_VARIANT_LABELS: Record<BrandGuidelineAssetVariant, string> =
  {
    light: "Light",
    dark: "Dark",
  };

export const ACCEPTED_BRAND_ASSET_TYPES_LABEL =
  "SVG, PNG, JPG, GIF, WebP or AVIF";

const COLOR_ROLE_VALUES = [
  "primary",
  "secondary",
  "accent",
  "background",
  "foreground",
  "neutral",
  "custom",
] as const satisfies readonly BrandGuidelineColorRole[];
export const COLOR_ROLE_OPTIONS = COLOR_ROLE_VALUES.map((value) => ({
  value,
  label: COLOR_ROLE_LABELS[value],
}));

const FONT_ROLE_VALUES = [
  "heading",
  "body",
  "button",
  "unknown",
] as const satisfies readonly BrandGuidelineFontRole[];
export const FONT_ROLE_OPTIONS = FONT_ROLE_VALUES.map((value) => ({
  value,
  label: FONT_ROLE_LABELS[value],
}));

const TOKEN_TYPE_VALUES = [
  "spacing",
  "radius",
  "shadow",
  "component",
  "unknown",
] as const satisfies readonly BrandGuidelineTokenType[];
export const TOKEN_TYPE_OPTIONS = TOKEN_TYPE_VALUES.map((value) => ({
  value,
  label: TOKEN_TYPE_LABELS[value],
}));

const ASSET_KIND_VALUES = [
  "logo",
  "wordmark",
] as const satisfies readonly BrandGuidelineAssetKind[];
export const ASSET_KIND_OPTIONS = ASSET_KIND_VALUES.map((value) => ({
  value,
  label: ASSET_KIND_LABELS[value],
}));

const ASSET_VARIANT_VALUES = [
  "light",
  "dark",
] as const satisfies readonly BrandGuidelineAssetVariant[];
export const ASSET_VARIANT_OPTIONS = ASSET_VARIANT_VALUES.map((value) => ({
  value,
  label: ASSET_VARIANT_LABELS[value],
}));

const SCREENSHOT_KIND_VALUES = [
  "desktop_hero",
  "desktop_full_page",
  "mobile_hero",
] as const satisfies readonly BrandGuidelineScreenshotKind[];
export const SCREENSHOT_KIND_OPTIONS = SCREENSHOT_KIND_VALUES.map((value) => ({
  value,
  label: SCREENSHOT_KIND_LABELS[value],
}));

export const ASSET_SLOTS = [
  { kind: "logo", variant: "light" },
  { kind: "logo", variant: "dark" },
  { kind: "wordmark", variant: "light" },
  { kind: "wordmark", variant: "dark" },
] as const satisfies readonly {
  kind: BrandGuidelineAssetKind;
  variant: BrandGuidelineAssetVariant;
}[];

export const EXPECTED_COLOR_ROLES = [
  "primary",
  "secondary",
  "accent",
] as const satisfies readonly BrandGuidelineColorRole[];
