export interface CommitPreview {
  sha: string;
  message: string;
  authorName: string;
  authorLogin: string | null;
  authoredAt: string;
  htmlUrl?: string;
}

export interface PullRequestPreview {
  number: number;
  title: string;
  authorLogin: string;
  mergedAt: string | null;
  htmlUrl?: string;
  merged?: boolean;
  state?: string;
}

export interface ReleasePreview {
  tagName: string;
  name: string;
  publishedAt: string;
  authorLogin: string;
  prerelease: boolean;
  htmlUrl?: string;
}

export interface LinearIssuePreviewItem {
  id: string;
  identifier: string;
  title: string;
  state: string | null;
  assignee: string | null;
  completedAt: string | null;
  url: string;
}

export interface LinearIntegrationPreviewItem {
  integrationId: string;
  displayName: string;
  issues: LinearIssuePreviewItem[];
}

export interface RepositoryPreview {
  repositoryId: string;
  owner: string;
  repo: string;
  commits: CommitPreview[];
  pullRequests: PullRequestPreview[];
  releases: ReleasePreview[];
}

export type PreviewFailureStage =
  | "repository_lookup"
  | "repository_metadata"
  | "token"
  | "commits"
  | "pull_requests"
  | "releases";

export interface RepositoryPreviewFailure {
  repositoryId: string;
  owner: string | null;
  repo: string | null;
  stage: PreviewFailureStage;
  message: string;
}

export type PreviewFailure = RepositoryPreviewFailure;
export type LinearIssuePreview = LinearIssuePreviewItem;
export type LinearIntegrationPreview = LinearIntegrationPreviewItem;

export interface PreviewResponse {
  repositories: Array<{
    repositoryId: string;
    owner: string;
    repo: string;
    commits?: CommitPreview[];
    pullRequests?: PullRequestPreview[];
    releases?: ReleasePreview[];
  }>;
  failures?: RepositoryPreviewFailure[];
  linearIntegrations?: LinearIntegrationPreviewItem[];
}

export interface PrSelection {
  repositoryId: string;
  number: number;
}

export interface ReleaseSelection {
  repositoryId: string;
  tagName: string;
}

export type EventType = "Commit" | "PR" | "Release" | "LinearIssue";
