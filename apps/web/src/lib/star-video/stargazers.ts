import { Data, Effect } from "effect";
import type { RepoStarData } from "@/types/star-video";
import type { GitHubRepo, GitHubUser } from "~types/github";

const MAX_AVATARS = 60;
const REVALIDATE_SECONDS = 60 * 60 * 24;

class RepoNotFound extends Data.TaggedError("RepoNotFound")<{
  readonly owner: string;
  readonly repo: string;
}> {}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "notra-star-video",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: buildHeaders(),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function withSize(avatarUrl: string): string {
  return `${avatarUrl}${avatarUrl.includes("?") ? "&" : "?"}s=140`;
}

function toAvatarUrls(users: GitHubUser[] | null): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const user of users ?? []) {
    if (!user.avatar_url || user.type !== "User" || seen.has(user.avatar_url)) {
      continue;
    }
    seen.add(user.avatar_url);
    urls.push(withSize(user.avatar_url));
    if (urls.length >= MAX_AVATARS) {
      break;
    }
  }
  return urls;
}

async function fetchAvatars(base: string): Promise<string[]> {
  if (process.env.GITHUB_TOKEN) {
    const stargazers = await fetchJson<GitHubUser[]>(
      `${base}/stargazers?per_page=100`
    );
    const fromStars = toAvatarUrls(stargazers);
    if (fromStars.length > 0) {
      return fromStars;
    }
  }

  const contributors = await fetchJson<GitHubUser[]>(
    `${base}/contributors?per_page=100`
  );
  const fromContributors = toAvatarUrls(contributors);
  if (fromContributors.length > 0) {
    return fromContributors;
  }

  const commits = await fetchJson<Array<{ author: GitHubUser | null }>>(
    `${base}/commits?per_page=100`
  );
  return toAvatarUrls(
    (commits ?? [])
      .map((commit) => commit.author)
      .filter((author): author is GitHubUser => Boolean(author))
  );
}

export const fetchRepoStarData = Effect.fn("fetchRepoStarData")(function* (
  owner: string,
  repo: string
) {
  const base = `https://api.github.com/repos/${owner}/${repo}`;

  const repoData = yield* Effect.promise(() => fetchJson<GitHubRepo>(base));

  if (!repoData) {
    return yield* Effect.fail(new RepoNotFound({ owner, repo }));
  }

  const avatars = yield* Effect.promise(() => fetchAvatars(base));
  const resolvedOwner = repoData.full_name.split("/")[0] ?? owner;

  return {
    id: `${resolvedOwner}/${repoData.name}`.toLowerCase(),
    owner: resolvedOwner,
    repo: repoData.name,
    stars: repoData.stargazers_count,
    avatars,
    htmlUrl: repoData.html_url,
  } satisfies RepoStarData;
});
