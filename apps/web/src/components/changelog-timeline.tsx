import Link from "next/link";
import { formatChangelogDate } from "@/utils/changelog";
import type { ChangelogTimelineProps } from "~types/changelog";

export function ChangelogTimeline({
  items,
  emptyTitle = "No updates yet",
  emptyDescription = "Check back soon for the latest product updates.",
}: ChangelogTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border border-dashed bg-muted/30 px-6 py-12 text-center">
        <h2 className="font-sans font-semibold text-foreground text-xl">
          {emptyTitle}
        </h2>
        <p className="mt-2 font-sans text-muted-foreground text-sm leading-6">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-0">
      {items.map((item, index) => (
        <div className="relative pl-8" key={item.id}>
          {index < items.length - 1 ? (
            <div className="absolute top-7 left-[4px] h-[calc(100%-1rem)] w-px bg-border" />
          ) : null}
          <div className="absolute top-2 left-0 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
          <time className="block font-sans text-foreground/45 text-sm">
            {formatChangelogDate(item.date)}
          </time>
          <Link className="group block py-6" href={item.href}>
            <h2 className="font-sans font-semibold text-foreground text-xl tracking-tight transition-colors group-hover:text-primary">
              {item.title}
            </h2>
            <p className="mt-2 font-sans text-muted-foreground text-sm leading-6 sm:text-base">
              {item.description}
            </p>
          </Link>
        </div>
      ))}
    </div>
  );
}
