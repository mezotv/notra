import { TitleCard } from "@notra/ui/components/ui/title-card";
import Link from "next/link";
import type { ShowcaseOverviewGridProps } from "~types/showcase";

export function ShowcaseOverviewGrid({ companies }: ShowcaseOverviewGridProps) {
  return (
    <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {companies.map((company) => (
        <Link
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href={`/changelog/${company.slug}`}
          key={company.slug}
        >
          <TitleCard
            accentColor={company.accentColor}
            action={
              <span className="rounded-full border border-border px-2.5 py-0.5 text-muted-foreground text-xs">
                {company.entryCount}{" "}
                {company.entryCount === 1 ? "Post" : "Posts"}
              </span>
            }
            className="h-full cursor-pointer transition-colors hover:bg-muted/80"
            heading={company.name}
            icon={company.icon}
          >
            <p className="text-muted-foreground text-sm">
              {company.description}
            </p>
          </TitleCard>
        </Link>
      ))}
    </div>
  );
}
