import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  InstrumentEmptyProps,
  InstrumentModuleProps,
} from "@/types/instrument";

export function InstrumentModule({
  eyebrow,
  description,
  readout,
  action,
  children,
  className,
  bodyClassName,
  variant = "flat",
  bareBody = false,
}: InstrumentModuleProps) {
  if (variant === "panel") {
    return (
      <Card
        className={cn(
          "min-w-0 flex-1 overflow-visible rounded-2xl bg-transparent p-0 ring-0",
          className
        )}
      >
        <CardHeader
          className={
            bareBody
              ? "px-1"
              : "min-h-24 content-start rounded-t-2xl border border-border border-b-0 bg-muted pt-4 pb-9"
          }
        >
          <CardTitle>{eyebrow}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
          {(readout || action) && (
            <CardAction className="flex min-w-0 items-center gap-2">
              {readout && (
                <span className="truncate text-muted-foreground text-xs tabular-nums">
                  {readout}
                </span>
              )}
              {action}
            </CardAction>
          )}
        </CardHeader>
        <CardContent
          className={cn(
            bareBody
              ? "flex flex-1 flex-col p-0"
              : "-mt-9 relative flex flex-1 flex-col rounded-2xl border border-border bg-card p-6",
            bodyClassName
          )}
        >
          {children}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("min-w-0 flex-1", className)}>
      <CardHeader className="items-center">
        <CardTitle className="text-sm capitalize">{eyebrow}</CardTitle>
        {(readout || action) && (
          <CardAction className="flex min-w-0 items-center gap-2 self-center">
            {readout && (
              <span className="truncate text-muted-foreground text-xs capitalize tabular-nums">
                {readout}
              </span>
            )}
            {action}
          </CardAction>
        )}
      </CardHeader>
      <CardContent className={cn("min-w-0 flex-1", bodyClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

export function InstrumentSection({
  eyebrow,
  readout,
  action,
  children,
  className,
  bodyClassName,
}: InstrumentModuleProps) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h2 className="font-medium text-foreground text-sm capitalize">
          {eyebrow}
        </h2>
        {(readout || action) && (
          <div className="flex min-w-0 items-center gap-2">
            {readout && (
              <span className="truncate text-muted-foreground text-xs capitalize tabular-nums">
                {readout}
              </span>
            )}
            {action}
          </div>
        )}
      </div>
      <div className={cn("min-w-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

export function InstrumentEmpty({ message, className }: InstrumentEmptyProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-56 flex-col items-center justify-center gap-3 text-center",
        className
      )}
    >
      <p className="text-muted-foreground text-sm capitalize">{message}</p>
    </div>
  );
}
