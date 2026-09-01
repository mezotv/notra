export function AuthOrDivider() {
  return (
    <div className="relative flex items-center">
      <span className="inline-block h-px w-full border-t bg-border" />
      <span className="shrink-0 px-2 text-muted-foreground text-xs uppercase">
        Or
      </span>
      <span className="inline-block h-px w-full border-t bg-border" />
    </div>
  );
}
