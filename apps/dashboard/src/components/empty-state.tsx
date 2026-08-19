import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import type { EmptyStateProps } from "@/types/components/empty-state";

function EmptyState({
  title,
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
      <Button
        className="w-fit gap-1.5 px-3"
        onClick={onActionClick}
        variant={actionVariant}
      >
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
          : "justify-center rounded-2xl border border-dashed bg-muted/15 px-6 py-16",
        className
      )}
      {...props}
    >
      {preview ? (
        <div
          aria-hidden
          className="pointer-events-none w-full shrink-0 select-none px-3 pt-3 sm:px-4 sm:pt-4"
        >
          <div className="opacity-[0.38] [mask-image:linear-gradient(to_bottom,black_0%,transparent_100%)]">
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
        <h3 className="text-balance font-semibold text-lg">{title}</h3>
        <p className="mt-1.5 text-pretty text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
        {renderedAction ? (
          <div className="relative z-10 mt-5 flex flex-wrap items-center justify-center gap-2 [&_a]:inline-flex [&_a]:items-center [&_a]:justify-center [&_button]:h-8 [&_button]:w-fit [&_button]:gap-1.5 [&_button]:px-3 [&_button]:text-sm">
            {renderedAction}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export { EmptyState };
