export const GITHUB_OWNER = "usenotra";
export const GITHUB_REPO = "notra";
export const GITHUB_REPO_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`;

// Cache tag for revalidating GitHub data on demand
export const GITHUB_CACHE_TAG = "github-contributors";

// Revalidate every hour (3600s). This is the key mechanism that prevents users
// from being rate-limited: Next.js serves the cached response to all visitors
// and refreshes it at most once per hour per host.
const REVALIDATE_SECONDS = 3600;

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
}

export interface GitHubLabel {
  name: string;
  color: string;
}

interface GitHubUserRef {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: string;
  user: GitHubUserRef;
  created_at: string;
  labels: GitHubLabel[];
  pull_request?: { url: string };
}

export interface GitHubPR {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: string;
  user: GitHubUserRef;
  created_at: string;
  draft: boolean;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  description: string | null;
  private: boolean;
}

export interface ContributorsStats {
  totalStars: number;
  totalForks: number;
  totalIssues: number;
  totalContributors: number;
}

export interface ContributorsData {
  repo: GitHubRepo | null;
  contributors: GitHubUser[];
  issues: GitHubIssue[];
  prs: GitHubPR[];
  stats: ContributorsStats;
}

const EMPTY_DATA: ContributorsData = {
  repo: null,
  contributors: [],
  issues: [],
  prs: [],
  stats: {
    totalStars: 0,
    totalForks: 0,
    totalIssues: 0,
    totalContributors: 0,
  },
};

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": `${GITHUB_OWNER}-${GITHUB_REPO}-site`,
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
      // Next.js caches this response at the data-cache layer. A single upstream
      // fetch per hour regardless of traffic avoids GitHub rate limits.
      next: {
        revalidate: REVALIDATE_SECONDS,
        tags: [GITHUB_CACHE_TAG],
      },
    });
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchContributorsData(): Promise<ContributorsData> {
  const base = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

  const [repo, contributorsRaw, issuesRaw, prsRaw] = await Promise.all([
    fetchJson<GitHubRepo>(base),
    fetchJson<GitHubUser[]>(`${base}/contributors?per_page=100`),
    fetchJson<GitHubIssue[]>(
      `${base}/issues?state=open&per_page=20&sort=created`
    ),
    fetchJson<GitHubPR[]>(`${base}/pulls?state=open&per_page=5&sort=created`),
  ]);

  if (!repo && !contributorsRaw && !issuesRaw && !prsRaw) {
    return EMPTY_DATA;
  }

  const contributors = (contributorsRaw ?? [])
    .filter((c) => c.type === "User")
    .filter((c) => !c.login.endsWith("[bot]"));

  const issues = (issuesRaw ?? [])
    .filter((issue) => !issue.pull_request)
    .slice(0, 5);

  const prs = (prsRaw ?? []).slice(0, 5);

  return {
    repo,
    contributors: contributors.slice(0, 24),
    issues,
    prs,
    stats: {
      totalStars: repo?.stargazers_count ?? 0,
      totalForks: repo?.forks_count ?? 0,
      totalIssues: repo?.open_issues_count ?? 0,
      totalContributors: contributors.length,
    },
  };
}

export function formatGitHubDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function getIssueTypeFromLabels(labels: GitHubLabel[]): {
  type: string;
  className: string;
} {
  const lowered = labels.map((l) => l.name.toLowerCase());
  if (lowered.some((name) => name.includes("bug"))) {
    return {
      type: "Bug",
      className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    };
  }
  if (
    lowered.some(
      (name) => name.includes("feature") || name.includes("enhancement")
    )
  ) {
    return {
      type: "Feature",
      className:
        "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    };
  }
  if (lowered.some((name) => name.includes("doc"))) {
    return {
      type: "Docs",
      className:
        "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    };
  }
  return {
    type: "Issue",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  };
}
