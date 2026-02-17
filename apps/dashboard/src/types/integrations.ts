import type React from "react";

export interface RepositoryOutput {
  id: string;
  outputType: string;
  enabled: boolean;
}

export interface GitHubRepository {
  id: string;
  owner: string;
  repo: string;
  defaultBranch: string | null;
  enabled: boolean;
  hasWebhook?: boolean;
  outputs?: RepositoryOutput[];
}

export interface GitHubIntegration {
  id: string;
  displayName: string;
  enabled: boolean;
  createdAt: string;
  createdByUser?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  repositories: GitHubRepository[];
}

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  fullUrl: string;
}

export interface AddIntegrationDialogProps {
  organizationId?: string;
  organizationSlug?: string;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export interface IntegrationCardProps {
  integration: GitHubIntegration;
  organizationId: string;
  organizationSlug: string;
  onUpdate?: () => void;
}

export interface WebhookConfig {
  webhookUrl: string;
  webhookSecret: string;
  repositoryId: string;
  owner: string;
  repo: string;
}

export interface WebhookSetupDialogProps {
  repositoryId: string;
  organizationId: string;
  owner: string;
  repo: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}
