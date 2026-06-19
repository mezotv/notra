import { Schema } from "effect";

const GitHubAppInstallationAccountSchema = Schema.Struct({
  id: Schema.Number,
  login: Schema.String,
  name: Schema.optional(Schema.NullOr(Schema.String)),
  avatar_url: Schema.String,
  type: Schema.Union([Schema.Literal("User"), Schema.Literal("Organization")]),
});

export const GitHubAppInstallationResponseSchema = Schema.Struct({
  id: Schema.Number,
  account: Schema.NullOr(GitHubAppInstallationAccountSchema),
  repository_selection: Schema.Union([
    Schema.Literal("all"),
    Schema.Literal("selected"),
  ]),
});

export const GitHubAppRepositoryResponseSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  full_name: Schema.String,
  private: Schema.Boolean,
  description: Schema.NullOr(Schema.String),
  default_branch: Schema.String,
  owner: Schema.Struct({
    login: Schema.String,
  }),
});

export const GitHubAppRepositoriesResponseSchema = Schema.Struct({
  repositories: Schema.Array(GitHubAppRepositoryResponseSchema),
});

export const GitHubAppRepositorySchema = Schema.Struct({
  id: Schema.String,
  owner: Schema.String,
  name: Schema.String,
  fullName: Schema.String,
  private: Schema.Boolean,
  description: Schema.NullOr(Schema.String),
  defaultBranch: Schema.String,
});

export const GitHubAppRepositoryCacheSchema = Schema.Array(
  GitHubAppRepositorySchema
);

export type GitHubAppInstallationResponse =
  typeof GitHubAppInstallationResponseSchema.Type;
export type GitHubAppRepositoryResponse =
  typeof GitHubAppRepositoryResponseSchema.Type;
export type GitHubAppRepository = typeof GitHubAppRepositorySchema.Type;

export const decodeGitHubAppInstallationResponse = Schema.decodeUnknownEffect(
  GitHubAppInstallationResponseSchema
);
export const decodeGitHubAppRepositoriesResponse = Schema.decodeUnknownEffect(
  GitHubAppRepositoriesResponseSchema
);
export const decodeCachedGitHubAppRepositories = Schema.decodeUnknownEffect(
  GitHubAppRepositoryCacheSchema
);
