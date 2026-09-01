import type { ContributorsStats } from "~types/github";

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-6">
      <div className="font-display text-foreground text-3xl leading-tight font-medium tracking-[-0.02em] md:text-4xl">
        {value.toLocaleString()}
      </div>
      <div className="text-muted-foreground font-sans text-sm font-medium">
        {label}
      </div>
    </div>
  );
}

export function Stats({ stats }: { stats: ContributorsStats }) {
  return (
    <div className="border-border grid w-full grid-cols-2 gap-0 border-y md:grid-cols-4">
      <div className="border-border border-r md:border-r">
        <Stat label="Contributors" value={stats.totalContributors} />
      </div>
      <div className="md:border-border md:border-r">
        <Stat label="Stars" value={stats.totalStars} />
      </div>
      <div className="border-border border-t border-r md:border-t-0 md:border-r">
        <Stat label="Forks" value={stats.totalForks} />
      </div>
      <div className="border-border border-t md:border-t-0">
        <Stat label="Open Issues" value={stats.totalIssues} />
      </div>
    </div>
  );
}
