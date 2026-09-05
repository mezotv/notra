"use client";

import { ArrowUpRight01Icon, GitCommitIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notra } from "@notra/ui/components/ui/svgs/notra";

import type { GitHubPublishResultCardProps } from "@/types/content/detail";

export function GitHubPublishResultCard({
  pullRequest,
  repositoryLabel,
  title,
}: GitHubPublishResultCardProps) {
  const wasCreated = pullRequest.operation === "created";

  return (
    <div className="bg-muted/20 my-4 overflow-hidden rounded-lg border">
      <div className="flex items-start gap-3 p-3">
        <div className="ring-foreground/10 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f6f3f1] p-1 ring-1">
          <Notra className="size-full" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">docs: add {title}</p>
          <p className="text-muted-foreground mt-1 truncate text-xs">
            {repositoryLabel}#{pullRequest.pullRequestNumber} ·{" "}
            {wasCreated ? "Created as draft" : "Updated"}
          </p>
        </div>
        <a
          aria-label={`Open pull request #${pullRequest.pullRequestNumber} on GitHub`}
          className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
          href={pullRequest.pullRequestUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <HugeiconsIcon className="size-4" icon={ArrowUpRight01Icon} />
        </a>
      </div>

      <div className="text-muted-foreground flex min-w-0 items-center gap-2 border-t px-3 py-2.5 text-xs">
        <HugeiconsIcon className="size-4 shrink-0" icon={GitCommitIcon} />
        <span className="truncate">
          {wasCreated ? "Added" : "Updated"} {pullRequest.path}
        </span>
        <span aria-hidden="true">·</span>
        <span className="max-w-32 truncate font-mono">
          {pullRequest.branchName}
        </span>
      </div>
    </div>
  );
}
