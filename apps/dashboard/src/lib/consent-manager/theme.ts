import type { Theme } from "@c15t/nextjs";

const smoothingSlot = {
  style: {
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
  },
} satisfies NonNullable<Theme["slots"]>["consentBanner"];

const colors = {
  primary: "var(--primary)",
  primaryHover: "var(--ring)",
  surface: "var(--card)",
  surfaceHover: "var(--secondary)",
  border: "var(--border)",
  borderHover: "var(--ring)",
  text: "var(--foreground)",
  textMuted: "var(--muted-foreground)",
  textOnPrimary: "var(--primary-foreground)",
  overlay: "hsl(0 0% 0% / 0.5)",
  switchTrack: "var(--input)",
  switchTrackActive: "var(--primary)",
  switchThumb: "var(--card)",
};

export const consentTheme = {
  colors,
  dark: colors,
  typography: {
    fontFamily: "var(--font-sans)",
  },
  radius: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
  },
  shadows: {
    sm: "var(--shadow-sm)",
    md: "var(--shadow-md)",
    lg: "var(--shadow-lg)",
  },
  slots: {
    consentBanner: smoothingSlot,
    consentBannerCard: smoothingSlot,
    consentDialog: smoothingSlot,
    consentDialogCard: smoothingSlot,
  },
} satisfies Theme;
