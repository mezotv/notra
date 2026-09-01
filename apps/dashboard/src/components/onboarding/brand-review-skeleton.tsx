import { Skeleton } from "@notra/ui/components/ui/skeleton";

export function BrandReviewSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}
