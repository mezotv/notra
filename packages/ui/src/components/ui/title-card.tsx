import type * as React from "react";

import { cn } from "@notra/ui/lib/utils";

interface TitleCardProps extends Omit<React.ComponentProps<"div">, "title"> {
  heading: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  accentColor?: string;
  contentClassName?: string;
  disabled?: boolean;
}

function TitleCard({
  heading,
  icon,
  action,
  accentColor,
  className,
  contentClassName,
  disabled = false,
  children,
  ...props
}: TitleCardProps) {
  const gradientStyle = accentColor
    ? {
        backgroundImage: `linear-gradient(to bottom right, ${accentColor}20 0%, transparent 50%)`,
      }
    : undefined;

  return (
    <div
      aria-disabled={disabled || undefined}
      className={cn(
        "group relative flex flex-col rounded-lg border border-border/80 bg-muted/80 p-2",
        disabled && "cursor-not-allowed",
        className
      )}
      {...props}
    >
      {accentColor && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-200",
            !disabled && "group-hover:opacity-100"
          )}
          style={gradientStyle}
        />
      )}
      <div
        className={cn(
          "flex items-start justify-between gap-4 py-1.5 pr-2",
          icon ? "pl-3" : "pl-2"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {icon && (
            <div className="flex size-8 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-5">
              {icon}
            </div>
          )}
          <p className="min-w-0 flex-1 truncate font-medium text-lg">{heading}</p>
        </div>
        {action && (
          <div className="flex shrink-0 items-center gap-2">{action}</div>
        )}
      </div>
      <div
        className={cn(
          "flex-1 rounded-lg border border-border/80 bg-background px-4 py-3",
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}

export { TitleCard };
export type { TitleCardProps };
