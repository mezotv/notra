import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import type { EmptyStateProps } from "@/types/components/empty-state";

function EmptyState({
  title,
  titleIcon,
  description,
  action,
  actionLabel,
  actionVariant = "default",
  onActionClick,
  actionIcon,
  preview,
  className,
  ...props
}: EmptyStateProps) {
  const renderedAction =
    action ??
    (actionLabel ? (
      <Button onClick={onActionClick} variant={actionVariant}>
        {actionIcon}
        {actionLabel}
      </Button>
    ) : null);

  return (
    <div
      className={cn(
        "relative flex min-h-72 w-full flex-col items-center overflow-hidden text-center",
        preview
          ? "rounded-2xl"
          : "bg-muted/15 justify-center rounded-2xl border border-dashed px-6 py-16",
        className
      )}
      {...props}
    >
      {preview ? (
        <div
          aria-hidden
          className="pointer-events-none w-full shrink-0 px-3 pt-3 select-none sm:px-4 sm:pt-4"
        >
          <div className="[mask-image:linear-gradient(to_bottom,black_0%,transparent_100%)] opacity-[0.38]">
            {preview}
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "relative z-10 flex w-full max-w-md flex-col items-center",
          preview && "-mt-4 px-6 pt-2 pb-10"
        )}
      >
        <h3 className="flex items-center justify-center gap-2 text-lg font-semibold text-balance">
          {titleIcon}
          {title}
        </h3>
        <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed text-pretty">
          {description}
        </p>
        {renderedAction ? (
          <div className="relative z-10 mt-5 flex flex-wrap items-center justify-center gap-2">
            {renderedAction}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export { EmptyState };
