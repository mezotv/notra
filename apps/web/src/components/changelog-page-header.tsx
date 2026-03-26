import type { ChangelogPageHeaderProps } from "~types/changelog";

export function ChangelogPageHeader({
  eyebrow,
  title,
  description,
  meta,
}: ChangelogPageHeaderProps) {
  return (
    <div className="flex w-full max-w-[680px] flex-col items-center justify-start gap-4 self-center text-center">
      {eyebrow ? (
        <p className="font-medium font-sans text-muted-foreground text-sm uppercase tracking-[0.2em]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-balance font-sans font-semibold text-3xl text-foreground leading-tight tracking-tight md:text-5xl md:leading-[60px]">
        {title}
      </h1>
      <div className="text-balance font-sans text-base text-muted-foreground leading-7">
        {description}
      </div>
      {meta ? <div>{meta}</div> : null}
    </div>
  );
}
