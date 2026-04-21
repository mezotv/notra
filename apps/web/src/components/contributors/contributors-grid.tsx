import Image from "next/image";
import Link from "next/link";
import type { GitHubUser } from "~types/github";

export function ContributorsGrid({
  contributors,
}: {
  contributors: GitHubUser[];
}) {
  if (contributors.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        Unable to load contributors right now. Try again later.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
      {contributors.map((contributor) => (
        <Link
          aria-label={`${contributor.login} — ${contributor.contributions} contributions`}
          className="group flex flex-col items-center gap-2 rounded-lg p-2 transition-colors hover:bg-muted"
          href={contributor.html_url}
          key={contributor.id}
          rel="noopener noreferrer"
          target="_blank"
          title={`${contributor.login} — ${contributor.contributions} contributions`}
        >
          <Image
            alt={`Avatar of ${contributor.login}`}
            className="size-12 rounded-full ring-1 ring-border transition-transform duration-200 group-hover:scale-110"
            height={96}
            src={contributor.avatar_url}
            unoptimized
            width={96}
          />
          <span className="w-full truncate text-center font-sans text-muted-foreground text-xs transition-colors group-hover:text-foreground">
            {contributor.login}
          </span>
        </Link>
      ))}
    </div>
  );
}
