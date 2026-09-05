"use client";

import { cn } from "@notra/ui/lib/utils";

interface CarouselProgressProps {
  activeIndex: number;
  labels: readonly string[];
  onSelect: (index: number) => void;
  progress: number;
  variant?: "default" | "inverted";
  className?: string;
}

function CarouselProgress({
  activeIndex,
  labels,
  onSelect,
  progress,
  variant = "default",
  className,
}: CarouselProgressProps) {
  const progressWidth = Math.min(100, Math.max(0, progress));

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {labels.map((label, index) => {
        const isActive = index === activeIndex;

        return (
          <button
            aria-current={isActive ? "true" : undefined}
            aria-label={label}
            className={cn(
              "relative h-2 cursor-pointer rounded-full transition-all duration-slow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none",
              isActive ? "w-12" : "w-2",
              variant === "inverted"
                ? isActive
                  ? "bg-white/20"
                  : "bg-white/40 hover:bg-white/60"
                : isActive
                  ? "bg-foreground/15"
                  : "bg-foreground/20 hover:bg-foreground/40"
            )}
            key={label}
            onClick={() => onSelect(index)}
            type="button"
          >
            {isActive ? (
              <span
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full",
                  variant === "inverted" ? "bg-white" : "bg-foreground/60"
                )}
                style={{ width: `${progressWidth}%` }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export { CarouselProgress };
