import { getEnabledGithubTitleFilterRules } from "@notra/ai/integrations/title-filters";
import type { TitleFilterRule } from "@notra/ai/types/tools";
import { getCommitTitle, isTitleExcluded } from "@notra/ai/utils/title-filters";
import type { GithubProcessedEvent } from "@/types/webhooks/webhooks";

function getStringField(data: Record<string, unknown>, key: string) {
  const value = data[key];
  return typeof value === "string" ? value : null;
}

function isCommitExcluded(commit: unknown, rules: TitleFilterRule[]) {
  if (typeof commit !== "object" || commit === null) {
    return false;
  }

  if (!("message" in commit) || typeof commit.message !== "string") {
    return false;
  }

  return isTitleExcluded(getCommitTitle(commit.message), rules);
}

function filterReleaseEvent(
  processedEvent: GithubProcessedEvent,
  rules: TitleFilterRule[]
) {
  const title =
    getStringField(processedEvent.data, "name") ??
    getStringField(processedEvent.data, "tagName");

  return isTitleExcluded(title, rules) ? null : processedEvent;
}

function toHeadCommit(commit: unknown) {
  if (typeof commit !== "object" || commit === null) {
    return null;
  }

  if (!("id" in commit) || typeof commit.id !== "string") {
    return null;
  }

  if (!("message" in commit) || typeof commit.message !== "string") {
    return null;
  }

  return { id: commit.id, message: commit.message };
}

function filterPushEvent(
  processedEvent: GithubProcessedEvent,
  rules: TitleFilterRule[]
) {
  const commits = processedEvent.data.commits;
  if (!Array.isArray(commits)) {
    return processedEvent;
  }

  const remainingCommits = commits.filter(
    (commit) => !isCommitExcluded(commit, rules)
  );

  if (remainingCommits.length === 0) {
    return null;
  }

  const headCommitExcluded = isCommitExcluded(
    processedEvent.data.headCommit,
    rules
  );

  if (remainingCommits.length === commits.length && !headCommitExcluded) {
    return processedEvent;
  }

  return {
    ...processedEvent,
    data: {
      ...processedEvent.data,
      commits: remainingCommits,
      headCommit: headCommitExcluded
        ? toHeadCommit(remainingCommits.at(-1))
        : processedEvent.data.headCommit,
    },
  };
}

export async function applyTitleFiltersToGithubEvent(
  repositoryId: string,
  processedEvent: GithubProcessedEvent
): Promise<GithubProcessedEvent | null> {
  const rules = await getEnabledGithubTitleFilterRules(repositoryId);
  if (rules.length === 0) {
    return processedEvent;
  }

  if (processedEvent.type === "release") {
    return filterReleaseEvent(processedEvent, rules);
  }

  if (processedEvent.type === "push") {
    return filterPushEvent(processedEvent, rules);
  }

  return processedEvent;
}
