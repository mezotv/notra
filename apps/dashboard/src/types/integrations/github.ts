import type React from "react";

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
