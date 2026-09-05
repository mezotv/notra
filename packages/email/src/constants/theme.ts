/**
 * Hex twins of the light theme in `packages/ui/src/styles/globals.css`
 * and GEO status in `packages/ui/src/styles/status.css`. Email clients do
 * not resolve oklch / CSS variables, so these stay literal.
 */
export const EMAIL_THEME = {
  background: "#FFFFFF",
  foreground: "#171717",
  muted: "#F5F5F5",
  mutedForeground: "#737373",
  border: "#E5E5E5",
  primary: "#8B5CF6",
  radius: "8px",
  geoUp: "#328455",
  geoUpWash: "#EAF3EE",
  geoDown: "#D83E38",
  geoDownWash: "#FBECEB",
  /** Hex twins of `cta-gradient-primary` in `packages/ui/src/styles/cta-button.css`. */
  ctaFrom: "#A385FF",
  ctaTo: "#7C00FF",
  ctaGlow: "#8B5CF640",
} as const;
