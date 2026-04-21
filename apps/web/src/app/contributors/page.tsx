import { Button } from "@notra/ui/components/ui/button";
import { Github } from "@notra/ui/components/ui/svgs/github";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { TrackedSignupLink } from "@/components/tracked-signup-link";
import {
  type ContributorsData,
  fetchContributorsData,
  formatGitHubDate,
  GITHUB_REPO_URL,
  getIssueTypeFromLabels,
} from "@/utils/github";
import {
  DEFAULT_SOCIAL_IMAGE,
  SITE_URL,
  TWITTER_HANDLE,
} from "@/utils/metadata";

const title = "Contributors & Community";
const description =
  "Meet the developers who build Notra. Explore open issues, pull requests, and join our community.";
const url = `${SITE_URL}/contributors`;

// Revalidate the whole page at most once per hour. Combined with the fetch-level
// caching in `fetchContributorsData`, this means upstream GitHub API calls happen
// at most once an hour per deployment — users never hit GitHub themselves, and
// are shielded from rate limits even at high traffic.
export const revalidate = 3600;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    title,
    description,
    url,
    type: "website",
    siteName: "Notra",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [DEFAULT_SOCIAL_IMAGE.url],
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
  },
};

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-6">
      <div className="font-sans font-semibold text-3xl text-foreground leading-tight md:text-4xl">
        {value.toLocaleString()}
      </div>
      <div className="font-medium font-sans text-muted-foreground text-sm">
        {label}
      </div>
    </div>
  );
}

const STATS_SKELETON_KEYS = ["a", "b", "c", "d"] as const;
const CONTRIBUTORS_SKELETON_KEYS = Array.from(
  { length: 16 },
  (_, i) => `contrib-${i}`
);
const ISSUE_SKELETON_KEYS = ["i1", "i2", "i3", "i4", "i5"] as const;

function StatsSkeleton() {
  return (
    <div className="grid w-full grid-cols-2 gap-0 border-border border-y md:grid-cols-4">
      {STATS_SKELETON_KEYS.map((key) => (
        <div className="flex flex-col items-center gap-2 px-4 py-6" key={key}>
          <div className="h-9 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function ContributorsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
      {CONTRIBUTORS_SKELETON_KEYS.map((key) => (
        <div className="flex flex-col items-center gap-2" key={key}>
          <div className="size-12 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function IssueListSkeleton() {
  return (
    <div className="space-y-3">
      {ISSUE_SKELETON_KEYS.map((key) => (
        <div
          className="h-20 w-full animate-pulse rounded-lg border border-border/60 bg-muted"
          key={key}
        />
      ))}
    </div>
  );
}

function Stats({ data }: { data: ContributorsData }) {
  return (
    <div className="grid w-full grid-cols-2 gap-0 border-border border-y md:grid-cols-4">
      <div className="border-border border-r md:border-r">
        <Stat label="Contributors" value={data.stats.totalContributors} />
      </div>
      <div className="md:border-border md:border-r">
        <Stat label="Stars" value={data.stats.totalStars} />
      </div>
      <div className="border-border border-t border-r md:border-t-0 md:border-r">
        <Stat label="Forks" value={data.stats.totalForks} />
      </div>
      <div className="border-border border-t md:border-t-0">
        <Stat label="Open Issues" value={data.stats.totalIssues} />
      </div>
    </div>
  );
}

function ContributorsGrid({ data }: { data: ContributorsData }) {
  if (data.contributors.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        Unable to load contributors right now. Try again later.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
      {data.contributors.map((contributor) => (
        <Link
          aria-label={`${contributor.login} — ${contributor.contributions} contributions`}
          className="group flex flex-col items-center gap-2 rounded-lg p-2 transition-colors hover:bg-muted"
          href={contributor.html_url}
          key={contributor.id}
          rel="noopener noreferrer"
          target="_blank"
          title={`${contributor.login} — ${contributor.contributions} contributions`}
        >
          <Image
            alt={`Avatar of ${contributor.login}`}
            className="size-12 rounded-full ring-1 ring-border transition-transform duration-200 group-hover:scale-110"
            height={96}
            src={contributor.avatar_url}
            unoptimized
            width={96}
          />
          <span className="w-full truncate text-center font-sans text-muted-foreground text-xs transition-colors group-hover:text-foreground">
            {contributor.login}
          </span>
        </Link>
      ))}
    </div>
  );
}

function IssueList({ data }: { data: ContributorsData }) {
  if (data.issues.length === 0) {
    return (
      <div className="rounded-lg border border-border border-dashed py-8 text-center text-muted-foreground text-sm">
        No open issues at the moment
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {data.issues.map((issue) => {
        const issueType = getIssueTypeFromLabels(issue.labels);
        return (
          <div
            className="rounded-lg border border-border/60 bg-card p-4 transition-all duration-200 hover:border-border hover:shadow-sm"
            key={issue.id}
          >
            <div className="flex items-start gap-3">
              <Image
                alt={`Avatar of ${issue.user.login}`}
                className="mt-0.5 size-6 flex-shrink-0 rounded-full"
                height={48}
                src={issue.user.avatar_url}
                unoptimized
                width={48}
              />
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs ${issueType.className}`}
                  >
                    {issueType.type}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    #{issue.number}
                  </span>
                </div>
                <Link
                  className="line-clamp-2 font-medium font-sans text-foreground text-sm transition-colors hover:text-primary"
                  href={issue.html_url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {issue.title}
                </Link>
                <p className="mt-1 text-muted-foreground text-xs">
                  by {issue.user.login} • {formatGitHubDate(issue.created_at)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PullRequestList({ data }: { data: ContributorsData }) {
  if (data.prs.length === 0) {
    return (
      <div className="rounded-lg border border-border border-dashed py-8 text-center text-muted-foreground text-sm">
        No open pull requests at the moment
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {data.prs.map((pr) => (
        <div
          className="rounded-lg border border-border/60 bg-card p-4 transition-all duration-200 hover:border-border hover:shadow-sm"
          key={pr.id}
        >
          <div className="flex items-start gap-3">
            <Image
              alt={`Avatar of ${pr.user.login}`}
              className="mt-0.5 size-6 flex-shrink-0 rounded-full"
              height={48}
              src={pr.user.avatar_url}
              unoptimized
              width={48}
            />
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs ${
                    pr.draft
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
                      : "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                  }`}
                >
                  {pr.draft ? "Draft" : "Ready"}
                </span>
                <span className="text-muted-foreground text-xs">
                  #{pr.number}
                </span>
              </div>
              <Link
                className="line-clamp-2 font-medium font-sans text-foreground text-sm transition-colors hover:text-primary"
                href={pr.html_url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {pr.title}
              </Link>
              <p className="mt-1 text-muted-foreground text-xs">
                by {pr.user.login} • {formatGitHubDate(pr.created_at)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ViewAllLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      className="group inline-flex items-center gap-1 font-medium font-sans text-primary text-sm hover:underline"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
      <svg
        aria-hidden="true"
        className="size-4 transition-transform group-hover:translate-x-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          clipRule="evenodd"
          d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
          fillRule="evenodd"
        />
      </svg>
    </Link>
  );
}

async function ContributorsContent() {
  const data = await fetchContributorsData();
  return (
    <>
      <Stats data={data} />

      <section className="flex w-full flex-col gap-8 px-4 py-12 sm:px-6 md:px-8 md:py-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="font-sans font-semibold text-2xl text-foreground tracking-tight md:text-3xl">
            Our Contributors
          </h2>
          <p className="max-w-2xl text-balance text-muted-foreground">
            Thank you to everyone who has contributed code, issues, and ideas to
            Notra.
          </p>
        </div>

        <div className="mx-auto w-full max-w-4xl">
          <ContributorsGrid data={data} />
        </div>
      </section>

      <section className="grid w-full grid-cols-1 gap-8 border-border border-t px-4 py-12 sm:px-6 md:grid-cols-2 md:gap-10 md:px-8 md:py-16">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="font-sans font-semibold text-foreground text-xl md:text-2xl">
              Open Issues
            </h2>
            <ViewAllLink href={`${GITHUB_REPO_URL}/issues`}>
              View all
            </ViewAllLink>
          </div>
          <IssueList data={data} />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="font-sans font-semibold text-foreground text-xl md:text-2xl">
              Open Pull Requests
            </h2>
            <ViewAllLink href={`${GITHUB_REPO_URL}/pulls`}>
              View all
            </ViewAllLink>
          </div>
          <PullRequestList data={data} />
        </div>
      </section>
    </>
  );
}

function ContributorsSkeletonFallback() {
  return (
    <>
      <StatsSkeleton />
      <section className="flex w-full flex-col gap-8 px-4 py-12 sm:px-6 md:px-8 md:py-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="font-sans font-semibold text-2xl text-foreground tracking-tight md:text-3xl">
            Our Contributors
          </h2>
          <p className="max-w-2xl text-balance text-muted-foreground">
            Loading our amazing community…
          </p>
        </div>
        <div className="mx-auto w-full max-w-4xl">
          <ContributorsSkeleton />
        </div>
      </section>
      <section className="grid w-full grid-cols-1 gap-8 border-border border-t px-4 py-12 sm:px-6 md:grid-cols-2 md:gap-10 md:px-8 md:py-16">
        <div className="flex flex-col gap-6">
          <div className="h-7 w-40 animate-pulse rounded bg-muted" />
          <IssueListSkeleton />
        </div>
        <div className="flex flex-col gap-6">
          <div className="h-7 w-48 animate-pulse rounded bg-muted" />
          <IssueListSkeleton />
        </div>
      </section>
    </>
  );
}

export default function ContributorsPage() {
  return (
    <div className="flex w-full flex-col items-center justify-start overflow-hidden border-border/70 border-b pt-20 sm:pt-24 md:pt-28 lg:pt-32">
      <section className="flex w-full items-center justify-center px-6 py-12 md:px-24 md:py-16">
        <div className="flex w-full max-w-[586px] flex-col items-center gap-4">
          <h1 className="text-balance text-center font-sans font-semibold text-3xl text-foreground leading-tight tracking-tight md:text-5xl md:leading-[60px]">
            Contributors & <span className="text-primary">community</span>
          </h1>
          <p className="text-center font-normal font-sans text-base text-muted-foreground leading-7">
            Meet the developers who build Notra. Browse open issues, check in on
            pull requests, and jump in anytime.
          </p>
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
            <Button
              className="h-10 overflow-hidden rounded-lg border-transparent bg-primary px-6 py-2 hover:bg-primary-hover"
              nativeButton={false}
              render={<TrackedSignupLink source="contributors_cta" />}
            >
              <span className="font-medium font-sans text-primary-foreground text-sm">
                Try Notra for free
              </span>
            </Button>
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-5 font-medium font-sans text-foreground text-sm transition-colors hover:bg-muted"
              href={GITHUB_REPO_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Github className="size-4" />
              View on GitHub
            </Link>
          </div>
        </div>
      </section>

      <Suspense fallback={<ContributorsSkeletonFallback />}>
        <ContributorsContent />
      </Suspense>
    </div>
  );
}
