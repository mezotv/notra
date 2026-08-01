import {
  SIGNAL_KIND_GITHUB_PULL_REQUEST_MERGED,
  SIGNAL_KIND_GITHUB_PUSH,
  SIGNAL_KIND_GITHUB_RELEASE_PUBLISHED,
  SIGNAL_SOURCE_GITHUB,
} from "@notra/ai/constants/autonomy-signals";
import { computeSignalDedupeHash } from "@notra/ai/utils/autonomy-hash";

export const buildGithubReleaseSignalHash = (
  repositoryId: string,
  tagName: string
): string =>
  computeSignalDedupeHash(
    SIGNAL_SOURCE_GITHUB,
    SIGNAL_KIND_GITHUB_RELEASE_PUBLISHED,
    `${repositoryId}:${tagName}`
  );

export const buildGithubPushSignalHash = (
  repositoryId: string,
  headCommitSha: string
): string =>
  computeSignalDedupeHash(
    SIGNAL_SOURCE_GITHUB,
    SIGNAL_KIND_GITHUB_PUSH,
    `${repositoryId}:${headCommitSha}`
  );

export const buildGithubPullRequestMergedSignalHash = (
  repositoryId: string,
  pullRequestNumber: number
): string =>
  computeSignalDedupeHash(
    SIGNAL_SOURCE_GITHUB,
    SIGNAL_KIND_GITHUB_PULL_REQUEST_MERGED,
    `${repositoryId}:${pullRequestNumber}`
  );
