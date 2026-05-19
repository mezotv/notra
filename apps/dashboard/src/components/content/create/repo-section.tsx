"use client";

import { Github } from "@notra/ui/components/ui/svgs/github";
import type { ContentDataPointSettings } from "@/schemas/content";
import type { RepositoryPreview } from "@/types/content/preview";
import {
  formatEventDate,
  prSelectionToKey,
  releaseSelectionToKey,
} from "@/utils/content-preview";
import { EventRow } from "./event-row";

interface RepoSectionProps {
  repo: RepositoryPreview;
  dataPoints: ContentDataPointSettings;
  selectedCommitKeys: Set<string>;
  selectedPrKeys: Set<string>;
  selectedReleaseKeys: Set<string>;
  onToggleCommit: (sha: string) => void;
  onTogglePr: (key: string) => void;
  onToggleRelease: (key: string) => void;
}

export function RepoSection({
  repo,
  dataPoints,
  selectedCommitKeys,
  selectedPrKeys,
  selectedReleaseKeys,
  onToggleCommit,
  onTogglePr,
  onToggleRelease,
}: RepoSectionProps) {
  const showCommits = dataPoints.includeCommits && repo.commits.length > 0;
  const showPrs =
    dataPoints.includePullRequests && repo.pullRequests.length > 0;
  const showReleases = dataPoints.includeReleases && repo.releases.length > 0;

  if (!(showCommits || showPrs || showReleases)) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-2 bg-muted/30 px-3 py-2">
        <Github className="size-4 shrink-0" />
        <span className="font-medium text-sm">
          {repo.owner}/{repo.repo}
        </span>
      </div>
      <div className="divide-y">
        {showReleases &&
          repo.releases.map((release) => {
            const releaseKey = releaseSelectionToKey({
              repositoryId: repo.repositoryId,
              tagName: release.tagName,
            });
            return (
              <EventRow
                key={releaseKey}
                label={release.name || release.tagName}
                meta={`${release.authorLogin} · ${formatEventDate(release.publishedAt)}${release.prerelease ? " · pre-release" : ""}`}
                onToggle={() => onToggleRelease(releaseKey)}
                selected={selectedReleaseKeys.has(releaseKey)}
                type="Release"
              />
            );
          })}
        {showPrs &&
          repo.pullRequests.map((pr) => {
            const prKey = prSelectionToKey({
              repositoryId: repo.repositoryId,
              number: pr.number,
            });
            return (
              <EventRow
                key={prKey}
                label={`#${pr.number} ${pr.title}`}
                meta={`${pr.authorLogin} · ${pr.mergedAt ? formatEventDate(pr.mergedAt) : ""}`}
                onToggle={() => onTogglePr(prKey)}
                selected={selectedPrKeys.has(prKey)}
                type="PR"
              />
            );
          })}
        {showCommits &&
          repo.commits.map((commit) => (
            <EventRow
              key={commit.sha}
              label={commit.message}
              meta={`${commit.authorLogin ?? commit.authorName} · ${commit.authoredAt ? formatEventDate(commit.authoredAt) : ""} · ${commit.sha.slice(0, 7)}`}
              onToggle={() => onToggleCommit(commit.sha)}
              selected={selectedCommitKeys.has(commit.sha)}
              type="Commit"
            />
          ))}
      </div>
    </div>
  );
}
