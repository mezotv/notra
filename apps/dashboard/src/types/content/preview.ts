export interface CommitPreview {
  sha: string;
  message: string;
  authorName: string;
  authoredAt: string;
}

export interface PullRequestPreview {
  number: number;
  title: string;
  authorLogin: string;
  mergedAt: string | null;
}

export interface ReleasePreview {
  tagName: string;
  name: string;
  publishedAt: string;
  authorLogin: string;
  prerelease: boolean;
}

export interface RepositoryPreview {
  repositoryId: string;
  owner: string;
  repo: string;
  commits: CommitPreview[];
  pullRequests: PullRequestPreview[];
  releases: ReleasePreview[];
}

export interface PreviewFailure {
  repositoryId: string;
  owner: string | null;
  repo: string | null;
  stage:
    | "repository_lookup"
    | "repository_metadata"
    | "token"
    | "commits"
    | "pull_requests"
    | "releases";
  message: string;
}

export interface PreviewResponse {
  repositories: Array<{
    repositoryId: string;
    owner: string;
    repo: string;
    commits?: CommitPreview[];
    pullRequests?: PullRequestPreview[];
    releases?: ReleasePreview[];
  }>;
  failures?: PreviewFailure[];
}

export interface PrSelection {
  repositoryId: string;
  number: number;
}

export interface ReleaseSelection {
  repositoryId: string;
  tagName: string;
}

export type EventType = "Commit" | "PR" | "Release";
