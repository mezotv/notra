export const IMAGE_EXPORT_TARGETS = ["paper", "figma", "wonder"] as const;

export const IMAGE_EXPORT_TARGET_LABELS: Record<
  (typeof IMAGE_EXPORT_TARGETS)[number],
  string
> = {
  paper: "Paper",
  figma: "Figma",
  wonder: "Wonder",
};
