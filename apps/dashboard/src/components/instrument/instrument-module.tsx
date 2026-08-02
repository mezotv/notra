import { DitherAvatar } from "@notra/ui/components/dither-kit/avatar";
import { cn } from "@/lib/utils";
import type {
  InstrumentEmptyProps,
  InstrumentModuleProps,
} from "@/types/instrument";

export function InstrumentModule({
  eyebrow,
  readout,
  action,
  children,
  className,
  bodyClassName,
}: InstrumentModuleProps) {
  return (
    <section className={cn("flex min-w-0 flex-1 flex-col bg-card", className)}>
      <header className="flex min-h-9 items-center justify-between gap-3 border-border border-b px-3 py-1.5">
        <h2 className="font-mono text-[0.625rem] text-muted-foreground uppercase tracking-[0.14em]">
          {eyebrow}
        </h2>
        <div className="flex min-w-0 items-center gap-2">
          {readout && (
            <span className="truncate font-mono text-[0.625rem] text-muted-foreground tabular-nums tracking-wide">
              {readout}
            </span>
          )}
          {action}
        </div>
      </header>
      <div className={cn("min-w-0 flex-1 p-3", bodyClassName)}>{children}</div>
    </section>
  );
}

export function InstrumentEmpty({
  seed,
  message,
  className,
}: InstrumentEmptyProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-32 flex-col items-center justify-center gap-3 text-center",
        className
      )}
    >
      <DitherAvatar animate className="size-10 opacity-70" name={seed} />
      <p className="font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-wider">
        {message}
      </p>
    </div>
  );
}
