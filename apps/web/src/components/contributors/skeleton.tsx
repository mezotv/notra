const STATS_SKELETON_KEYS = ["a", "b", "c", "d"] as const;
const CONTRIBUTORS_SKELETON_KEYS = Array.from(
  { length: 16 },
  (_, i) => `contrib-${i}`
);
const ISSUE_SKELETON_KEYS = ["i1", "i2", "i3", "i4", "i5"] as const;

function StatsSkeleton() {
  return (
    <div className="border-border grid w-full grid-cols-2 gap-0 border-y md:grid-cols-4">
      {STATS_SKELETON_KEYS.map((key) => (
        <div className="flex flex-col items-center gap-2 px-4 py-6" key={key}>
          <div className="bg-muted h-9 w-16 animate-pulse rounded" />
          <div className="bg-muted h-4 w-20 animate-pulse rounded" />
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
          <div className="bg-muted size-12 animate-pulse rounded-full" />
          <div className="bg-muted h-3 w-16 animate-pulse rounded" />
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
          className="border-border/60 bg-muted h-20 w-full animate-pulse rounded-lg border"
          key={key}
        />
      ))}
    </div>
  );
}

export function ContributorsPageSkeleton() {
  return (
    <>
      <StatsSkeleton />
      <section className="flex w-full flex-col gap-8 px-4 py-12 sm:px-6 md:px-8 md:py-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-foreground font-sans text-2xl font-semibold tracking-tight md:text-3xl">
            Our Contributors
          </h2>
          <p className="text-muted-foreground max-w-2xl text-balance">
            Loading our amazing community…
          </p>
        </div>
        <div className="mx-auto w-full max-w-4xl">
          <ContributorsSkeleton />
        </div>
      </section>
      <section className="border-border grid w-full grid-cols-1 gap-8 border-t px-4 py-12 sm:px-6 md:grid-cols-2 md:gap-10 md:px-8 md:py-16">
        <div className="flex flex-col gap-6">
          <div className="bg-muted h-7 w-40 animate-pulse rounded" />
          <IssueListSkeleton />
        </div>
        <div className="flex flex-col gap-6">
          <div className="bg-muted h-7 w-48 animate-pulse rounded" />
          <IssueListSkeleton />
        </div>
      </section>
    </>
  );
}
