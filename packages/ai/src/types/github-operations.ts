import type { Effect } from "effect";

import type { GitHubAppRepository } from "../schemas/github-app";
import type {
  GitHubAppConfigurationError,
  GitHubCredentialDecryptionError,
  GitHubCredentialsMissingError,
  GitHubInstallationMissingError,
  GitHubPersistenceError,
  GitHubRepositoryConflictError,
  GitHubRepositoryUnavailableError,
  GitHubRepositoryCacheError,
  GitHubResponseError,
  GitHubRequestError,
} from "../schemas/github-operations";
import type { GitHubConnectionCredentials } from "./github-connection";

export interface GitHubInstallationReference {
  id: string;
  organizationId: string;
  installationId: string;
}

export interface SelectGitHubRepositoriesParams {
  organizationId: string;
  userId: string;
  repositoryIds: string[];
}

export interface SelectedGitHubRepository {
  installationRecordId: string;
  repository: GitHubAppRepository;
}

export interface SaveGitHubRepositorySelectionParams {
  organizationId: string;
  userId: string;
  installationRecordIds: string[];
  repositories: SelectedGitHubRepository[];
}

export interface ExistingGitHubRepository {
  id: string;
  owner: string | null;
  repo: string | null;
  githubRepositoryId: string | null;
  githubAppInstallationId: string | null;
}

export type GitHubRepositorySelectionError =
  | GitHubRepositoryCacheError
  | GitHubResponseError
  | GitHubPersistenceError
  | GitHubRequestError
  | GitHubAppConfigurationError
  | GitHubInstallationMissingError
  | GitHubRepositoryUnavailableError
  | GitHubRepositoryConflictError;

export interface GitHubRepositorySelectionDependencies {
  listInstallations: (
    organizationId: string
  ) => Effect.Effect<GitHubInstallationReference[], GitHubPersistenceError>;
  listRepositories: (
    installation: GitHubInstallationReference
  ) => Effect.Effect<
    readonly GitHubAppRepository[],
    | GitHubRequestError
    | GitHubAppConfigurationError
    | GitHubRepositoryCacheError
    | GitHubResponseError
  >;
  saveSelection: (
    params: SaveGitHubRepositorySelectionParams
  ) => Effect.Effect<
    void,
    | GitHubPersistenceError
    | GitHubRepositoryConflictError
    | GitHubInstallationMissingError
  >;
  invalidateRepositories: (
    installation: GitHubInstallationReference
  ) => Effect.Effect<void, GitHubRepositoryCacheError>;
}

export interface ResolveGitHubTokenParams {
  integrationId: string;
  organizationId?: string;
}

export type GitHubTokenError =
  | GitHubPersistenceError
  | GitHubRequestError
  | GitHubAppConfigurationError
  | GitHubInstallationMissingError
  | GitHubCredentialsMissingError
  | GitHubCredentialDecryptionError;

export interface GitHubTokenDependencies {
  findIntegration: (
    params: ResolveGitHubTokenParams
  ) => Effect.Effect<
    (GitHubConnectionCredentials & { organizationId: string }) | undefined,
    GitHubPersistenceError
  >;
  findInstallation: (
    recordId: string,
    organizationId: string
  ) => Effect.Effect<
    { installationId: string } | undefined,
    GitHubPersistenceError
  >;
  createInstallationToken: (
    installationId: string
  ) => Effect.Effect<string, GitHubRequestError | GitHubAppConfigurationError>;
  decryptToken: (
    encryptedToken: string,
    integrationId: string
  ) => Effect.Effect<string, GitHubCredentialDecryptionError>;
}
