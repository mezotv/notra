export const IMAGE_EXPORT_TARGETS = ["paper", "figma", "wonder"] as const;

export const EXPORT_HTML_FORBIDDEN_SELECTOR =
  "script, iframe, frame, frameset, object, embed, applet, meta, base, link, form, input, button, textarea, select";

export const EXPORT_HTML_URL_ATTRIBUTES = [
  "src",
  "href",
  "xlink:href",
  "action",
  "formaction",
  "background",
  "poster",
  "data",
] as const;

export const EXPORT_HTML_SAFE_URL_SCHEMES = [
  "http:",
  "https:",
  "data:",
] as const;

export const IMAGE_EXPORT_TARGET_LABELS: Record<
  (typeof IMAGE_EXPORT_TARGETS)[number],
  string
> = {
  paper: "Paper",
  figma: "Figma",
  wonder: "Wonder",
};
