import { ContributorsGrid } from "@/components/contributors/contributors-grid";
import { IssueList } from "@/components/contributors/issue-list";
import { PullRequestList } from "@/components/contributors/pull-request-list";
import { Stats } from "@/components/contributors/stats";
import { ViewAllLink } from "@/components/contributors/view-all-link";
import { fetchContributorsData, GITHUB_REPO_URL } from "@/utils/github";

export async function ContributorsContent() {
  const data = await fetchContributorsData();
  return (
    <>
      <Stats stats={data.stats} />

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
          <ContributorsGrid contributors={data.contributors} />
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
          <IssueList issues={data.issues} />
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
          <PullRequestList prs={data.prs} />
        </div>
      </section>
    </>
  );
}
