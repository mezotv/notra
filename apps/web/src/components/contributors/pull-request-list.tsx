import Image from "next/image";
import Link from "next/link";
import { formatGitHubDate } from "@/utils/github";
import type { GitHubPR } from "~types/github";

export function PullRequestList({ prs }: { prs: GitHubPR[] }) {
  if (prs.length === 0) {
    return (
      <div className="rounded-lg border border-border border-dashed py-8 text-center text-muted-foreground text-sm">
        No open pull requests at the moment
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {prs.map((pr) => (
        <div
          className="rounded-lg border border-border/60 bg-card p-4 transition-all duration-200 hover:border-border hover:shadow-sm"
          key={pr.id}
        >
          <div className="flex items-start gap-3">
            <Image
              alt={`Avatar of ${pr.user.login}`}
              className="mt-0.5 size-6 flex-shrink-0 rounded-full"
              height={48}
              src={pr.user.avatar_url}
              unoptimized
              width={48}
            />
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs ${
                    pr.draft
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
                      : "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                  }`}
                >
                  {pr.draft ? "Draft" : "Ready"}
                </span>
                <span className="text-muted-foreground text-xs">
                  #{pr.number}
                </span>
              </div>
              <Link
                className="line-clamp-2 font-medium font-sans text-foreground text-sm transition-colors hover:text-primary"
                href={pr.html_url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {pr.title}
              </Link>
              <p className="mt-1 text-muted-foreground text-xs">
                by {pr.user.login} • {formatGitHubDate(pr.created_at)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
