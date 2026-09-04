import { cn } from "@notra/ui/lib/utils";
import type { PromptOutcomeIconProps } from "@notra/ui/types/geo";

const ICON_CLASS = "size-3.5 shrink-0";

/** Status glyph for a prompt outcome, in the same family as the feedback status icons. */
export function PromptOutcomeIcon({
  mentioned,
  className,
}: PromptOutcomeIconProps) {
  if (mentioned) {
    return (
      <svg
        aria-hidden="true"
        className={cn(ICON_CLASS, "text-geo-up", className)}
        fill="none"
        viewBox="0 0 16 16"
      >
        <circle cx="8" cy="8" fill="currentColor" r="6.25" />
        <path
          d="M5.25 8.15 7.1 10l3.65-3.8"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      </svg>
    );
  }
  return (
    <svg
      aria-hidden="true"
      className={cn(ICON_CLASS, "text-muted-foreground/60", className)}
      fill="none"
      viewBox="0 0 16 16"
    >
      <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
