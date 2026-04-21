import Image from "next/image";
import Link from "next/link";
import { formatGitHubDate, getIssueTypeFromLabels } from "@/utils/github";
import type { GitHubIssue } from "~types/github";

export function IssueList({ issues }: { issues: GitHubIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="rounded-lg border border-border border-dashed py-8 text-center text-muted-foreground text-sm">
        No open issues at the moment
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {issues.map((issue) => {
        const issueType = getIssueTypeFromLabels(issue.labels);
        return (
          <div
            className="rounded-lg border border-border/60 bg-card p-4 transition-all duration-200 hover:border-border hover:shadow-sm"
            key={issue.id}
          >
            <div className="flex items-start gap-3">
              <Image
                alt={`Avatar of ${issue.user.login}`}
                className="mt-0.5 size-6 flex-shrink-0 rounded-full"
                height={48}
                src={issue.user.avatar_url}
                unoptimized
                width={48}
              />
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs ${issueType.className}`}
                  >
                    {issueType.type}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    #{issue.number}
                  </span>
                </div>
                <Link
                  className="line-clamp-2 font-medium font-sans text-foreground text-sm transition-colors hover:text-primary"
                  href={issue.html_url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {issue.title}
                </Link>
                <p className="mt-1 text-muted-foreground text-xs">
                  by {issue.user.login} • {formatGitHubDate(issue.created_at)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
