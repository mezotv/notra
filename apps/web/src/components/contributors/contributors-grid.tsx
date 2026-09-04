import Image from "next/image";
import Link from "next/link";
import type { GitHubUser } from "~types/github";

import { formatContributionCount } from "@/utils/github";

export function ContributorsGrid({
  contributors,
}: {
  contributors: GitHubUser[];
}) {
  if (contributors.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        Unable to load contributors right now. Try again later.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
      {contributors.map((contributor) => {
        const contributionsLabel = `${contributor.contributions} contribution${
          contributor.contributions === 1 ? "" : "s"
        }`;
        return (
          <Link
            aria-label={`${contributor.login} — ${contributionsLabel}`}
            className="group hover:bg-muted flex flex-col items-center gap-2 rounded-lg p-2 transition-colors"
            href={contributor.html_url}
            key={contributor.id}
            rel="noopener noreferrer"
            target="_blank"
            title={`${contributor.login} — ${contributionsLabel}`}
          >
            <Image
              alt={`Avatar of ${contributor.login}`}
              className="ring-border duration-normal size-12 rounded-full ring-1 transition-transform group-hover:scale-110"
              height={96}
              src={contributor.avatar_url}
              width={96}
            />
            <span className="text-muted-foreground group-hover:text-foreground w-full truncate text-center font-sans text-xs transition-colors">
              {contributor.login}
            </span>
            <span className="text-muted-foreground group-hover:text-foreground w-full text-center font-sans text-[0.625rem] leading-none transition-colors">
              <span className="tabular-nums">
                {formatContributionCount(contributor.contributions)}
              </span>{" "}
              contribution{contributor.contributions === 1 ? "" : "s"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
