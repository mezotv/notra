import { IrisPollError } from "@notra/ai/autonomy/errors";
import {
  GITHUB_API_VERSION_HEADER,
  IRIS_POLL_COMMITS_PER_PAGE,
  IRIS_POLL_MAX_REPOSITORIES,
  IRIS_POLL_RELEASES_PER_PAGE,
  IRIS_POLL_REPOSITORY_CONCURRENCY,
} from "@notra/ai/constants/autonomy-poll";
import {
  GITHUB_PUSH_EVENT_ACTION,
  GITHUB_PUSH_EVENT_TYPE,
  GITHUB_RELEASE_EVENT_TYPE,
  GITHUB_RELEASE_PUBLISHED_ACTION,
  SIGNAL_KIND_GITHUB_PUSH,
  SIGNAL_KIND_GITHUB_RELEASE_PUBLISHED,
  SIGNAL_SOURCE_GITHUB,
} from "@notra/ai/constants/autonomy-signals";
import { getTokenForIntegrationId } from "@notra/ai/integrations/github";
import type {
  IrisPollItem,
  IrisPollRepository,
  IrisPollWindow,
  IrisSourcePollResult,
} from "@notra/ai/types/autonomy-poll";
import {
  buildGithubPushSignalHash,
  buildGithubReleaseSignalHash,
} from "@notra/ai/utils/github-signal-hash";
import { createOctokit } from "@notra/ai/utils/octokit";
import { db } from "@notra/db/drizzle";
import { githubIntegrations } from "@notra/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { Effect } from "effect";

const NO_REPOSITORIES_REASON = "No enabled GitHub repositories are connected";

const toGithubPollError = (message: string) => (cause: unknown) =>
  new IrisPollError({ message, source: SIGNAL_SOURCE_GITHUB, cause });

const isWithinWindow = (value: string | null, since: Date): boolean => {
  if (value === null) {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() >= since.getTime();
};

const toRepositoryName = (repository: IrisPollRepository): string =>
  `${repository.owner ?? "unknown"}/${repository.repo ?? "unknown"}`;

const listPollableRepositories = Effect.fn("iris.poll.github.repositories")(
  function* (organizationId: string) {
    return yield* Effect.tryPromise({
      try: () =>
        db
          .select({
            id: githubIntegrations.id,
            owner: githubIntegrations.owner,
            repo: githubIntegrations.repo,
            defaultBranch: githubIntegrations.defaultBranch,
          })
          .from(githubIntegrations)
          .where(
            and(
              eq(githubIntegrations.organizationId, organizationId),
              eq(githubIntegrations.enabled, true),
              eq(githubIntegrations.repositoryEnabled, true)
            )
          )
          .orderBy(desc(githubIntegrations.updatedAt))
          .limit(IRIS_POLL_MAX_REPOSITORIES),
      catch: toGithubPollError("Failed to load GitHub repositories to poll"),
    }).pipe(
      Effect.tap((repositories) =>
        repositories.length === IRIS_POLL_MAX_REPOSITORIES
          ? Effect.annotateLogs(
              Effect.logWarning("iris.poll.github.repositoryCapReached"),
              { organizationId, cap: IRIS_POLL_MAX_REPOSITORIES }
            )
          : Effect.void
      )
    );
  }
);

const fetchRecentReleases = Effect.fn("iris.poll.github.releases")(function* (
  repository: IrisPollRepository,
  token: string,
  since: Date
) {
  const octokit = createOctokit(token);
  const response = yield* Effect.tryPromise({
    try: () =>
      octokit.request("GET /repos/{owner}/{repo}/releases", {
        owner: repository.owner ?? "",
        repo: repository.repo ?? "",
        per_page: IRIS_POLL_RELEASES_PER_PAGE,
        headers: { "X-GitHub-Api-Version": GITHUB_API_VERSION_HEADER },
      }),
    catch: toGithubPollError(
      `Failed to list releases for ${toRepositoryName(repository)}`
    ),
  });

  const repositoryName = toRepositoryName(repository);

  const items: IrisPollItem[] = [];

  for (const release of response.data) {
    if (
      release.draft ||
      release.prerelease ||
      !isWithinWindow(release.published_at ?? null, since)
    ) {
      continue;
    }

    items.push({
      source: SIGNAL_SOURCE_GITHUB,
      kind: SIGNAL_KIND_GITHUB_RELEASE_PUBLISHED,
      dedupeHash: buildGithubReleaseSignalHash(repository.id, release.tag_name),
      sourceEventId: null,
      occurredAt: new Date(release.published_at ?? Date.now()),
      title: `Release ${release.tag_name}${release.name ? ` (${release.name})` : ""} in ${repositoryName}`,
      url: release.html_url,
      payload: {
        type: GITHUB_RELEASE_EVENT_TYPE,
        action: GITHUB_RELEASE_PUBLISHED_ACTION,
        data: {
          tagName: release.tag_name,
          name: release.name,
          body: release.body ?? null,
          prerelease: release.prerelease,
          draft: release.draft,
          publishedAt: release.published_at,
          url: release.html_url,
        },
        repositoryId: repository.id,
        repositoryName,
        discoveredBy: "poll",
      },
    });
  }

  return items;
});

const fetchRecentPush = Effect.fn("iris.poll.github.commits")(function* (
  repository: IrisPollRepository,
  token: string,
  since: Date
) {
  const octokit = createOctokit(token);
  const response = yield* Effect.tryPromise({
    try: () =>
      octokit.request("GET /repos/{owner}/{repo}/commits", {
        owner: repository.owner ?? "",
        repo: repository.repo ?? "",
        since: since.toISOString(),
        per_page: IRIS_POLL_COMMITS_PER_PAGE,
        ...(repository.defaultBranch ? { sha: repository.defaultBranch } : {}),
        headers: { "X-GitHub-Api-Version": GITHUB_API_VERSION_HEADER },
      }),
    catch: toGithubPollError(
      `Failed to list commits for ${toRepositoryName(repository)}`
    ),
  });

  const head = response.data.at(0);
  if (head === undefined) {
    return [];
  }

  const repositoryName = toRepositoryName(repository);
  const branch = repository.defaultBranch ?? "default";
  const commits = response.data.map((commit) => ({
    id: commit.sha,
    message: commit.commit.message,
    author: commit.author?.login ?? commit.commit.author?.name ?? "unknown",
    timestamp:
      commit.commit.committer?.date ?? commit.commit.author?.date ?? null,
    url: commit.html_url,
  }));

  const item: IrisPollItem = {
    source: SIGNAL_SOURCE_GITHUB,
    kind: SIGNAL_KIND_GITHUB_PUSH,
    dedupeHash: buildGithubPushSignalHash(repository.id, head.sha),
    sourceEventId: null,
    occurredAt: new Date(
      head.commit.committer?.date ?? head.commit.author?.date ?? Date.now()
    ),
    title: `${commits.length} commits on ${branch} in ${repositoryName}`,
    url: head.html_url,
    payload: {
      type: GITHUB_PUSH_EVENT_TYPE,
      action: GITHUB_PUSH_EVENT_ACTION,
      data: {
        branch,
        commits,
        headCommit: { id: head.sha, message: head.commit.message },
      },
      repositoryId: repository.id,
      repositoryName,
      discoveredBy: "poll",
    },
  };

  return [item];
});

const pollRepository = Effect.fn("iris.poll.github.repository")(function* (
  repository: IrisPollRepository,
  since: Date
) {
  if (!(repository.owner && repository.repo)) {
    return [];
  }

  const token = yield* Effect.tryPromise({
    try: () => getTokenForIntegrationId(repository.id),
    catch: toGithubPollError(
      `Failed to resolve a token for ${toRepositoryName(repository)}`
    ),
  });

  if (!token) {
    yield* Effect.annotateLogs(Effect.logWarning("iris.poll.github.noToken"), {
      repositoryId: repository.id,
    });
    return [];
  }

  const [releases, pushes] = yield* Effect.all(
    [
      fetchRecentReleases(repository, token, since),
      fetchRecentPush(repository, token, since),
    ],
    { concurrency: 2 }
  );

  return [...releases, ...pushes];
});

export const pollGithubSource = Effect.fn("iris.poll.github")(function* (
  window: IrisPollWindow
) {
  const repositories = yield* listPollableRepositories(window.organizationId);

  if (repositories.length === 0) {
    return {
      source: SIGNAL_SOURCE_GITHUB,
      items: [],
      skippedReason: NO_REPOSITORIES_REASON,
    } satisfies IrisSourcePollResult;
  }

  const results = yield* Effect.all(
    repositories.map((repository) =>
      pollRepository(repository, window.since).pipe(
        Effect.catch((error) =>
          Effect.annotateLogs(
            Effect.logWarning("iris.poll.github.repositoryFailed"),
            {
              repositoryId: repository.id,
              message: error.message,
            }
          ).pipe(Effect.as<IrisPollItem[]>([]))
        )
      )
    ),
    { concurrency: IRIS_POLL_REPOSITORY_CONCURRENCY }
  );

  return {
    source: SIGNAL_SOURCE_GITHUB,
    items: results.flat(),
    skippedReason: null,
  } satisfies IrisSourcePollResult;
});
