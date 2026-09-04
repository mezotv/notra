import type { createOctokit } from "@notra/ai/utils/octokit";
import type { redis } from "@notra/ai/utils/redis";
import { Data } from "effect";
import type React from "react";

import type { GitHubRepository } from "../integrations";

export type GitHubClient = ReturnType<typeof createOctokit>;
export type GitHubPublishContentType = "blog_post" | "changelog";

export class GitHubInstallStartError extends Data.TaggedError(
  "GitHubInstallStartError"
)<{
  readonly cause: unknown;
}> {}

export class GitHubAccountConnectionIncompleteError extends Data.TaggedError(
  "GitHubAccountConnectionIncompleteError"
)<{
  readonly callbackPath: string;
}> {}

export type GitHubAccountType = "User" | "Organization";

export interface GitHubAppAccount {
  id: string;
  login: string;
  name: string | null;
  avatarUrl: string;
  type: GitHubAccountType;
}

export interface GitHubAppRepository {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  private: boolean;
  description: string | null;
  defaultBranch: string;
}

export type GitHubInstallFailureReason =
  | "account-connection-incomplete"
  | "install-start-failed";

export type StartGitHubInstallResult =
  | { started: true }
  | { started: false; reason: GitHubInstallFailureReason };

export interface ConnectGitHubDialogProps {
  onConnect: () => void;
  isConnecting?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export interface GitHubAccountSelectProps {
  accounts: GitHubAppAccount[];
  selectedAccountId?: string;
  onSelectAccount?: (accountId: string) => void;
  onAddAccount?: () => void;
  disabled?: boolean;
}

export interface RepositoryMultiSelectProps {
  repositories: GitHubAppRepository[];
  value: string[];
  onChange: (value: string[]) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  accounts?: GitHubAppAccount[];
  selectedAccountId?: string;
  onSelectAccount?: (accountId: string) => void;
  onAddAccount?: () => void;
}

export interface SelectRepositoriesDialogProps {
  repositories: GitHubAppRepository[];
  onSave: (repositoryIds: string[]) => void;
  initialSelected?: string[];
  isLoading?: boolean;
  isSaving?: boolean;
  accounts?: GitHubAppAccount[];
  selectedAccountId?: string;
  onSelectAccount?: (accountId: string) => void;
  onAddAccount?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export interface GitHubIntegrationDialogProps {
  organizationId: string;
  organizationSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface GitHubAccountCardProps {
  account: GitHubAppAccount;
  repositories: GitHubAppRepository[];
  selectedRepositoryIds: string[];
  onAddRepositories: () => void;
  onDisconnect: () => void;
}

export interface GitHubPublishingSettingsProps {
  organizationId: string;
  repositories: GitHubRepository[];
}

export interface GitHubContentPublishingSettingsProps extends GitHubPublishingSettingsProps {
  contentLabel: string;
  contentType: GitHubPublishContentType;
  pluralLabel: string;
}

export interface GitHubContentDirectoryMutationVariables {
  nextDirectory: string;
  targetRepositoryId: string;
}

export interface GitHubOutputMutationVariables {
  enabled: boolean;
  outputId?: string;
}

export interface GitHubDirectoryPickerProps {
  contentLabel: string;
  directory: string;
  disabled?: boolean;
  isSaving?: boolean;
  onSave: (directory: string) => Promise<void>;
  organizationId: string;
  repositoryId: string;
  repositoryName: string;
  triggerId?: string;
}

export interface GitHubDirectoryNodeProps {
  depth: number;
  excludedPath?: string;
  name: string;
  open: boolean;
  organizationId: string;
  path: string;
  repositoryId: string;
}

export interface ResolveGitHubContentPathParams {
  contentId: string;
  customPath?: string;
  directory: string;
  slug: string | null;
  title: string;
}

export interface FindExistingGitHubPullRequestParams {
  branchName: string;
  defaultBranch: string;
  octokit: GitHubClient;
  owner: string;
  repo: string;
}

export interface ValidateExistingGitHubBranchParams {
  baseSha: string;
  branchName: string;
  octokit: GitHubClient;
  owner: string;
  path: string;
  repo: string;
}

export type GitHubPullRequestOperation = "created" | "updated";

export interface GitHubCreateCommitOnBranchResult {
  createCommitOnBranch: {
    commit: { oid: string };
  } | null;
}

export interface OpenInNotraBadgeUrls {
  dark: string;
  light: string;
}

export interface PublishContentDraftPullRequestParams {
  contentId: string;
  contentType: GitHubPublishContentType;
  owner: string;
  repo: string;
  defaultBranch: string;
  path: string;
  title: string;
  markdown: string;
  /** Deep link to the content in the Notra dashboard, rendered as an "Open in Notra" button. */
  contentUrl?: string;
  /** Absolute URLs of the "Open in Notra" badge images per color scheme. */
  badgeUrls?: OpenInNotraBadgeUrls;
}

export interface GitHubPullRequestSummary {
  number: number;
  html_url: string;
}

export type GitHubErrorHeaders = Record<string, string | number | undefined>;

export type GitHubPublishFailureKind =
  | "authentication"
  | "forbidden"
  | "permissions"
  | "rate_limit"
  | "unknown";

export interface GitHubPublishOutputTarget {
  outputId: string;
  outputType: GitHubPublishContentType;
  repositoryId: string;
}

export interface RecordGitHubPublishFailureParams extends GitHubPublishOutputTarget {
  organizationId: string;
}

export interface ClearGitHubPublishFailuresParams {
  organizationId: string;
  outputType: GitHubPublishContentType;
  repositoryId: string;
}

export type GitHubPublishFailureRedis = Pick<
  NonNullable<typeof redis>,
  "del" | "eval"
>;

export interface GitHubPublishFailureDependencies {
  pauseOutput?: (params: GitHubPublishOutputTarget) => Promise<boolean>;
  redisClient: GitHubPublishFailureRedis | null;
}

export type GitHubPublishRecovery = (
  | { code: "github_authentication_required" }
  | { code: "github_content_publishing_paused" }
  | {
      code: "github_app_permissions_required";
      permissionsUrl?: string;
    }
) & { publishingPaused?: boolean };
