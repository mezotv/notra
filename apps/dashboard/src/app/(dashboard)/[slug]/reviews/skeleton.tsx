import { Skeleton } from "@notra/ui/components/ui/skeleton";

const SKELETON_ROW_KEYS = ["row-1", "row-2", "row-3", "row-4"];

export function ReviewsInboxSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border/80 border-b-border/40 bg-muted/80 shadow-2xs">
      <div className="space-y-3 rounded-t-lg bg-background p-4">
        {SKELETON_ROW_KEYS.map((key) => (
          <div className="flex items-center gap-4 py-2" key={key}>
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <div className="ml-auto">
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
